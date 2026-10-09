"""Personal, uncached weekly football dashboard. No schema changes required."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import exists, func, or_
from sqlmodel import select
from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User
from app.models.match import Match, MatchPlayer, MatchInvite, MatchStats, MatchVerification

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

def summary(match: Match, player_id: str) -> dict:
    return {
        "id": match.id, "title": match.title, "location": match.turf or match.location,
        "date": utc(match.scheduledAt or match.matchDate).isoformat(),
        "format": match.format, "status": match.status,
        "spotsLeft": max(0, match.maxPlayers - len(match.players)),
        "joined": match.hostId == player_id or any(p.userId == player_id for p in match.players),
    }

@router.get("/week")
async def week(session: AsyncSession = Depends(get_session), user: dict = Depends(get_current_user)):
    player = (await session.execute(select(User).where(User.clerkId == user["sub"]))).scalars().first()
    if not player:
        raise HTTPException(404, "Profile not found")
    now = datetime.now(timezone.utc)
    end = now + timedelta(days=7)
    # Load personal games plus this week's public discovery window, not every
    # historical closed game and its roster for every home-screen request.
    personal = or_(Match.hostId == player.id, exists().where(
        MatchPlayer.matchId == Match.id, MatchPlayer.userId == player.id))
    scheduled = func.coalesce(Match.scheduledAt, Match.matchDate)
    matches = (await session.execute(select(Match).where(
        Match.status.in_(["open", "in_progress", "closed"]),
        or_(personal, (Match.status == "open") &
            ((Match.password == None) | (Match.password == "")) &
            (scheduled >= now.replace(tzinfo=None)) &
            (scheduled < end.replace(tzinfo=None)))
    ).options(selectinload(Match.players)))).scalars().all()
    mine = [m for m in matches if m.hostId == player.id or any(p.userId == player.id for p in m.players)]
    my_ids = [m.id for m in mine]
    my_stats = (await session.execute(select(MatchStats).where(
        MatchStats.matchId.in_(my_ids)
    ))).scalars().all() if my_ids else []
    votes = (await session.execute(select(MatchVerification).where(
        MatchVerification.verifierId == player.id, MatchVerification.matchId.in_(my_ids)
    ))).scalars().all() if my_ids else []
    voted = {(v.matchId, v.targetPlayerId) for v in votes}
    actions = []
    for match in mine:
        if match.status != "closed":
            continue
        stats = [s for s in my_stats if s.matchId == match.id]
        if not any(s.userId == player.id for s in stats) and (
            match.submissionDeadline is None or utc(match.submissionDeadline) > now
        ):
            actions.append({"kind": "submit", "matchId": match.id, "title": match.title,
                            "label": "Submit your match stats"})
        count = sum(s.userId != player.id and s.status in
                    ["pending", "pending_verification", "flagged_peer_verification"] and
                    (match.id, s.userId) not in voted for s in stats)
        if count and (match.verificationDeadline is None or utc(match.verificationDeadline) > now):
            actions.append({"kind": "verify", "matchId": match.id, "title": match.title,
                            "label": f"Verify {count} player submission(s)"})
    invite_count = len((await session.execute(select(MatchInvite).join(
        Match, Match.id == MatchInvite.matchId
    ).where(MatchInvite.receiverId == player.id, MatchInvite.status == "pending",
            Match.status == "open", Match.matchDate >= now.replace(tzinfo=None)))).scalars().all())
    upcoming = sorted([m for m in mine if m.status in ["open", "in_progress"] and
                       utc(m.scheduledAt or m.matchDate) >= now],
                      key=lambda m: utc(m.scheduledAt or m.matchDate))
    available = sorted([m for m in matches if m.status == "open" and not m.password and
                        now <= utc(m.scheduledAt or m.matchDate) < end and
                        len(m.players) < m.maxPlayers and m not in mine],
                       key=lambda m: utc(m.scheduledAt or m.matchDate))
    return {"upcoming": [summary(m, player.id) for m in upcoming[:5]],
            "available": [summary(m, player.id) for m in available[:5]],
            "actions": actions[:10], "pendingInvites": invite_count,
            "xp": player.xp, "level": player.level, "matchesPlayed": player.matchesPlayed}
