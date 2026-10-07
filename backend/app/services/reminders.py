"""Idempotent reminder generation and bounded per-device push delivery."""
import asyncio
import hashlib
import json
import logging
from datetime import datetime, timedelta
from sqlalchemy import or_, text
from sqlmodel import select
from app.models.match import Match, MatchPlayer, MatchStats, MatchVerification
from app.models.reminder import ReminderPreference, PushDevice, MatchReminder, ReminderSnapshot, PushDelivery
from app.core.config import settings

async def generate_reminders(session, now=None):
    now = now or datetime.utcnow()
    enabled = (await session.execute(select(ReminderPreference).where(ReminderPreference.enabled == True))).scalars().all()
    count = 0
    for preference in enabled:
        mine = select(MatchPlayer.matchId).where(MatchPlayer.userId == preference.userId)
        matches = (await session.execute(select(Match).where(or_(Match.hostId == preference.userId, Match.id.in_(mine)),
            Match.matchDate >= now - timedelta(days=7)))).scalars().all()
        for match in matches:
            fingerprint = hashlib.sha256(json.dumps([match.matchDate.isoformat(), match.location, match.turf,
                match.status == "cancelled"], sort_keys=True).encode()).hexdigest()
            snapshot = (await session.execute(select(ReminderSnapshot).where(ReminderSnapshot.userId == preference.userId,
                ReminderSnapshot.matchId == match.id))).scalars().first()
            events = []
            if not snapshot:
                snapshot = ReminderSnapshot(userId=preference.userId, matchId=match.id, fingerprint=fingerprint)
            elif snapshot.fingerprint != fingerprint:
                snapshot.version += 1
                snapshot.fingerprint = fingerprint
                if match.matchDate > now or match.status == "cancelled":
                    events.append((f"change:{snapshot.version}", "cancelled" if match.status == "cancelled" else "changed",
                        f"{match.title}: game cancelled." if match.status == "cancelled" else f"{match.title}: kickoff or venue changed. Check the latest details.", now + timedelta(days=2)))
            session.add(snapshot)
            remaining = match.matchDate - now
            if match.status in ("open", "full") and timedelta(0) < remaining <= timedelta(hours=24):
                slot = "1h" if remaining <= timedelta(hours=1) else "24h"
                events.append((f"kickoff:{match.matchDate.isoformat()}:{slot}", "kickoff",
                    f"{match.title}: kickoff within {'an hour' if slot == '1h' else '24 hours'}. Check your game details.", match.matchDate))
            if match.status == "closed":
                stats = (await session.execute(select(MatchStats).where(MatchStats.matchId == match.id))).scalars().all()
                if match.submissionDeadline and now < match.submissionDeadline <= now + timedelta(hours=6) and not any(s.userId == preference.userId for s in stats):
                    events.append(("submit", "submit", f"{match.title}: submit your stats before the window closes.", match.submissionDeadline))
                if match.verificationDeadline and now < match.verificationDeadline <= now + timedelta(hours=6):
                    voted = (await session.execute(select(MatchVerification.targetPlayerId).where(MatchVerification.matchId == match.id, MatchVerification.verifierId == preference.userId))).scalars().all()
                    if any(s.userId != preference.userId and s.userId not in voted and s.status in ("pending", "pending_verification", "flagged_peer_verification") for s in stats):
                        events.append(("verify", "verify", f"{match.title}: review your teammates’ stats before verification closes.", match.verificationDeadline))
            for key, kind, message, expiry in events:
                dedupe = f"{match.id}:{key}"
                exists = (await session.execute(select(MatchReminder.id).where(MatchReminder.userId == preference.userId, MatchReminder.dedupeKey == dedupe))).first()
                if not exists:
                    session.add(MatchReminder(userId=preference.userId, matchId=match.id, dedupeKey=dedupe,
                        kind=kind, message=message[:300], createdAt=now, expiresAt=expiry))
                    count += 1
            await session.flush()
    return count

async def send_push(session, now=None, sender=None):
    now = now or datetime.utcnow()
    if sender is None:
        if not settings.vapid_private_key or not settings.vapid_public_key:
            return
        from pywebpush import webpush
        def sender(device, reminder):
            return webpush(subscription_info={"endpoint": device.endpoint, "keys": {"p256dh": device.p256dh, "auth": device.auth}},
                data=json.dumps({"title": "STRYK match reminder", "body": reminder.message,
                    "url": f"/matches/{reminder.matchId}", "tag": reminder.id}),
                vapid_private_key=settings.vapid_private_key, vapid_claims={"sub": settings.vapid_subject},
                ttl=max(1, min(86400, int((reminder.expiresAt - now).total_seconds()))), timeout=10)
    reminders = (await session.execute(select(MatchReminder).join(ReminderPreference, ReminderPreference.userId == MatchReminder.userId)
        .where(ReminderPreference.enabled == True, MatchReminder.read == False, MatchReminder.expiresAt > now)
        .order_by(MatchReminder.createdAt).limit(100))).scalars().all()
    for reminder in reminders:
        devices = (await session.execute(select(PushDevice).where(PushDevice.userId == reminder.userId, PushDevice.active == True))).scalars().all()
        for device in devices:
            delivery = (await session.execute(select(PushDelivery).where(PushDelivery.reminderId == reminder.id, PushDelivery.deviceId == device.id))).scalars().first()
            if not delivery:
                delivery = PushDelivery(reminderId=reminder.id, deviceId=device.id)
            if delivery.deliveredAt or delivery.attempts >= 3:
                continue
            delivery.attempts += 1
            try:
                await asyncio.to_thread(sender, device, reminder)
                delivery.deliveredAt = now
            except Exception as error:
                status = getattr(error, "status_code", None)
                if status is None and getattr(error, "response", None) is not None:
                    status = error.response.status_code
                if status in (404, 410):
                    device.active = False
                    session.add(device)
                # Never log endpoint/key/response bodies.
                logging.warning("Push delivery failed (status=%s)", status)
            session.add(delivery)
            await session.flush()

async def reminder_worker(factory, interval_seconds=60):
    while True:
        try:
            async with factory() as session:
                # One worker owns a tick across replicas; lock releases on commit/rollback.
                if session.bind.dialect.name == "postgresql":
                    acquired = (await session.execute(text("SELECT pg_try_advisory_xact_lock(73910231)"))).scalar()
                    if not acquired:
                        await session.rollback()
                        await asyncio.sleep(interval_seconds)
                        continue
                await generate_reminders(session)
                await session.flush()
                await send_push(session)
                await session.commit()
        except asyncio.CancelledError:
            raise
        except Exception:
            logging.error("Reminder worker failed; it will retry on the next tick")
        await asyncio.sleep(interval_seconds)
