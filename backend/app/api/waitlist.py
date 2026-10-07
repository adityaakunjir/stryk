"""Authenticated standby queue, scoped to a single match."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.core.auth import get_current_user
from app.core.database import get_session
from app.api.recurring import player
from app.models.match import Match, MatchPlayer, MatchInvite
from app.models.player import User
from app.models.waitlist import MatchWaitlist
from app.services.waitlist import queue_open

router = APIRouter(tags=["waitlist"])

class WaitlistJoin(BaseModel):
    password: Optional[str] = Field(default=None, max_length=50)

async def locked_match(session, match_id):
    match = (await session.execute(select(Match).where(Match.id == match_id).with_for_update())).scalars().first()
    if not match:
        raise HTTPException(404, "Match not found")
    return match

async def queue_state(session, match, user):
    entries = (await session.execute(select(MatchWaitlist).where(MatchWaitlist.matchId == match.id)
        .order_by(MatchWaitlist.joinedAt, MatchWaitlist.id))).scalars().all()
    position = next((i + 1 for i, e in enumerate(entries) if e.userId == user.id), None)
    roster = (await session.execute(select(MatchPlayer.userId).where(MatchPlayer.matchId == match.id))).scalars().all()
    names = []
    if match.hostId == user.id:
        for entry in entries:
            person = await session.get(User, entry.userId)
            names.append({"username": person.username, "position": person.position} if person else {"username": "Player", "position": None})
    return {"count": len(entries), "position": position, "active": queue_open(match),
        "joined": user.id in roster, "full": len(roster) >= match.maxPlayers, "standbys": names}

@router.get("/{match_id}/waitlist")
async def get_queue(match_id: str, auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(404, "Match not found")
    return await queue_state(session, match, user)

@router.post("/{match_id}/waitlist")
async def join_queue(match_id: str, data: WaitlistJoin, auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    match = await locked_match(session, match_id)
    if not queue_open(match):
        raise HTTPException(409, "Standby closes at kickoff or when the game is started or cancelled")
    if match.password and match.password != data.password:
        invite = (await session.execute(select(MatchInvite).where(MatchInvite.matchId == match.id,
            MatchInvite.receiverId == user.id, MatchInvite.status.in_(["pending", "accepted"])))).scalars().first()
        if not invite:
            raise HTTPException(401, "Enter the game password to join standby")
    existing = (await session.execute(select(MatchWaitlist).where(MatchWaitlist.matchId == match.id,
        MatchWaitlist.userId == user.id))).scalars().first()
    state = await queue_state(session, match, user)
    if state["joined"]:
        raise HTTPException(409, "You’re already in this game")
    if not existing:
        if not state["full"]:
            raise HTTPException(409, "A spot is available. Join the game instead")
        session.add(MatchWaitlist(matchId=match.id, userId=user.id))
        await session.flush()
    state = await queue_state(session, match, user)
    await session.commit()
    return state

@router.delete("/{match_id}/waitlist")
async def leave_queue(match_id: str, auth: dict = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    user = await player(session, auth)
    match = await locked_match(session, match_id)
    entry = (await session.execute(select(MatchWaitlist).where(MatchWaitlist.matchId == match.id,
        MatchWaitlist.userId == user.id))).scalars().first()
    if entry:
        await session.delete(entry)
        await session.flush()
    state = await queue_state(session, match, user)
    await session.commit()
    return state
