"""Isolated reminders: eligibility, opt-in, deduplication and device isolation."""
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch
from fastapi import FastAPI, HTTPException
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel import SQLModel, select
import app.models
from app.api.reminders import router, validate_subscription, SubscriptionInput
from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User
from app.models.match import Match, MatchPlayer, MatchStats
from app.models.reminder import ReminderPreference, PushDevice, MatchReminder, PushDelivery
from app.services.reminders import generate_reminders, send_push

class ReminderTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        self.factory = async_sessionmaker(self.engine, expire_on_commit=False)
        self.now = datetime.utcnow()
        self.app = FastAPI()
        self.app.include_router(router)
        async def sessions():
            async with self.factory() as session:
                yield session
        self.app.dependency_overrides[get_session] = sessions
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "clerk-one"}
        self.client = AsyncClient(transport=ASGITransport(app=self.app), base_url="http://test")
        async with self.factory() as session:
            session.add_all([User(id="one", username="one", clerkId="clerk-one"), User(id="two", username="two", clerkId="clerk-two")])
            session.add_all([Match(id="soon", title="Tonight", location="Pune", hostId="one", matchDate=self.now+timedelta(minutes=30)),
                Match(id="other", title="Not yours", location="Pune", hostId="two", matchDate=self.now+timedelta(minutes=30)),
                Match(id="closed", title="Finished", location="Pune", hostId="two", matchDate=self.now-timedelta(hours=2), status="closed",
                    submissionDeadline=self.now+timedelta(hours=2), verificationDeadline=self.now+timedelta(hours=3))])
            await session.flush()
            session.add(MatchPlayer(matchId="closed", userId="one"))
            session.add(MatchStats(matchId="closed", userId="two"))
            await session.commit()
    async def asyncTearDown(self):
        await self.client.aclose()
        await self.engine.dispose()
    async def tick(self):
        async with self.factory() as session:
            count = await generate_reminders(session, self.now)
            await session.commit()
            return count
    async def test_opt_in_deadlines_and_dedupe(self):
        self.assertEqual(await self.tick(), 0)
        self.assertEqual((await self.client.patch("/reminders/preferences", json={"enabled": True})).status_code, 200)
        self.assertEqual(await self.tick(), 3)
        self.assertEqual(await self.tick(), 0)
        items = (await self.client.get("/reminders")).json()["items"]
        self.assertEqual({item["kind"] for item in items}, {"kickoff", "submit", "verify"})
        self.assertNotIn("other", {item["matchId"] for item in items})
        await self.client.patch("/reminders/preferences", json={"enabled": False})
        self.assertEqual(await self.tick(), 0)
    async def test_changes_cancellation_and_user_scoped_read(self):
        await self.client.patch("/reminders/preferences", json={"enabled": True})
        await self.tick()
        async with self.factory() as session:
            game = await session.get(Match, "soon")
            game.status = "cancelled"
            session.add(game)
            await session.commit()
        self.assertEqual(await self.tick(), 1)
        self.assertEqual(await self.tick(), 0)
        items = (await self.client.get("/reminders")).json()["items"]
        self.assertIn("cancelled", {item["kind"] for item in items})
        item_id = items[0]["id"]
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "clerk-two"}
        self.assertEqual((await self.client.get("/reminders")).json()["items"], [])
        self.assertEqual((await self.client.post(f"/reminders/{item_id}/read")).status_code, 404)
    async def test_per_device_delivery_and_expired_subscription(self):
        await self.client.patch("/reminders/preferences", json={"enabled": True})
        await self.tick()
        async with self.factory() as session:
            session.add_all([PushDevice(id="good", userId="one", endpoint="https://fcm.googleapis.com/test1", p256dh="test", auth="test"),
                PushDevice(id="gone", userId="one", endpoint="https://fcm.googleapis.com/test2", p256dh="test", auth="test")])
            await session.commit()
            calls = []
            def sender(device, reminder):
                calls.append((device.id, reminder.id))
                if device.id == "gone":
                    error = RuntimeError("gone")
                    error.status_code = 410
                    raise error
            await send_push(session, self.now, sender)
            await session.commit()
            first = len(calls)
            await send_push(session, self.now, sender)
            await session.commit()
            self.assertEqual(len(calls), first)
            self.assertFalse((await session.get(PushDevice, "gone")).active)
            receipts = (await session.execute(select(PushDelivery))).scalars().all()
            self.assertTrue(any(r.deliveredAt for r in receipts))
    def test_rejects_untrusted_push_targets_and_bad_keys(self):
        for endpoint in ("http://127.0.0.1/", "https://attacker.example/", "https://fcm.googleapis.com:bad/path"):
            with self.assertRaises(HTTPException):
                validate_subscription(SubscriptionInput(endpoint=endpoint, keys={}))
        with self.assertRaises(HTTPException):
            validate_subscription(SubscriptionInput(endpoint="https://fcm.googleapis.com/test", keys={"p256dh": "bad", "auth": "bad"}))

    async def test_explicit_device_test_is_scoped_and_rate_limited(self):
        endpoint = "https://fcm.googleapis.com/test-device"
        async with self.factory() as session:
            session.add(PushDevice(id="test-device", userId="one", endpoint=endpoint, p256dh="test", auth="test"))
            await session.commit()
        with patch("app.api.reminders.settings.vapid_public_key", "public"), patch("app.api.reminders.settings.vapid_private_key", "private"), patch("app.api.reminders.deliver_push") as sender:
            self.assertEqual((await self.client.post("/reminders/devices/test", json={"endpoint": endpoint})).status_code, 409)
            await self.client.patch("/reminders/preferences", json={"enabled": True})
            result = await self.client.post("/reminders/devices/test", json={"endpoint": endpoint})
            self.assertEqual(result.status_code, 200)
            self.assertTrue(result.json()["accepted"])
            self.assertEqual(sender.call_count, 1)
            self.assertEqual(sender.call_args.args[1]["url"], "/notifications")
            self.assertEqual((await self.client.post("/reminders/devices/test", json={"endpoint": endpoint})).status_code, 429)
            self.app.dependency_overrides[get_current_user] = lambda: {"sub": "clerk-two"}
            await self.client.patch("/reminders/preferences", json={"enabled": True})
            self.assertEqual((await self.client.post("/reminders/devices/test", json={"endpoint": endpoint})).status_code, 404)
            self.assertEqual(sender.call_count, 1)
        async with self.factory() as session:
            self.assertEqual((await session.execute(select(MatchReminder))).scalars().all(), [])

    async def test_device_test_invalidates_expired_subscription(self):
        endpoint = "https://fcm.googleapis.com/expired"
        await self.client.patch("/reminders/preferences", json={"enabled": True})
        async with self.factory() as session:
            session.add(PushDevice(id="expired", userId="one", endpoint=endpoint, p256dh="test", auth="test"))
            await session.commit()
        error = RuntimeError("Do not expose push-service response")
        error.status_code = 410
        with patch("app.api.reminders.settings.vapid_public_key", "public"), patch("app.api.reminders.settings.vapid_private_key", "private"), patch("app.api.reminders.deliver_push", side_effect=error):
            response = await self.client.post("/reminders/devices/test", json={"endpoint": endpoint})
            self.assertEqual(response.status_code, 410)
            self.assertNotIn("Do not expose", response.text)
        async with self.factory() as session:
            self.assertFalse((await session.get(PushDevice, "expired")).active)

if __name__ == "__main__":
    unittest.main()
