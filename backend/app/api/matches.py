"""
STRYK Backend - Matches API

Endpoints for creating matches, joining, checking in, etc.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.database import get_session
from app.models.match import Match, MatchParticipant
from app.models.player import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])

from pydantic import BaseModel

class MatchCreate(BaseModel):
    title: str
    location: str
    date_time: datetime
    max_players: int = 22


def _serialize_match(match: Match) -> dict:
    """Serialize a Match ORM object to a plain dict including participants."""
    participants = []
    if match.participants:
        for p in match.participants:
            participants.append({
                "id": p.id,
                "matchId": p.matchId,
                "userId": p.userId,
                "team": p.team,
                "checkedIn": p.checkedIn,
                "createdAt": p.createdAt.isoformat() if p.createdAt else None,
            })

    return {
        "id": match.id,
        "title": match.title,
        "location": match.location,
        "dateTime": match.dateTime.isoformat() if match.dateTime else None,
        "maxPlayers": match.maxPlayers,
        "status": match.status,
        "creatorId": match.creatorId,
        "createdAt": match.createdAt.isoformat() if match.createdAt else None,
        "participants": participants,
        "players": len(participants),
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_match(
    match_in: MatchCreate,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    clerk_id = user.get("sub")
    result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    match = Match(
        title=match_in.title,
        location=match_in.location,
        dateTime=match_in.date_time,
        maxPlayers=match_in.max_players,
        creatorId=db_user.id
    )
    session.add(match)
    await session.commit()
    await session.refresh(match)

    # Automatically add creator as a participant
    participant = MatchParticipant(matchId=match.id, userId=db_user.id)
    session.add(participant)
    await session.commit()

    # Re-fetch with participants eagerly loaded
    stmt = select(Match).where(Match.id == match.id).options(selectinload(Match.participants))
    fresh = await session.execute(stmt)
    match = fresh.scalars().first()

    return _serialize_match(match)


@router.get("/")
async def get_all_matches(session: AsyncSession = Depends(get_session)):
    statement = select(Match).options(selectinload(Match.participants))
    result = await session.execute(statement)
    matches = result.scalars().all()
    return [_serialize_match(m) for m in matches]


@router.get("/{match_id}")
async def get_match_by_id(
    match_id: str,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Match).where(Match.id == match_id).options(selectinload(Match.participants))
    result = await session.execute(stmt)
    match = result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"success": True, "data": _serialize_match(match)}


@router.post("/{match_id}/join")
async def join_match(
    match_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    clerk_id = user.get("sub")
    result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already joined
    stmt = select(MatchParticipant).where(
        MatchParticipant.matchId == match_id,
        MatchParticipant.userId == db_user.id
    )
    existing = await session.execute(stmt)
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Already joined this match")
        
    participant = MatchParticipant(matchId=match_id, userId=db_user.id)
    session.add(participant)
    await session.commit()
    await session.refresh(participant)
    return {"success": True, "data": {
        "id": participant.id,
        "matchId": participant.matchId,
        "userId": participant.userId,
        "team": participant.team,
        "checkedIn": participant.checkedIn,
    }}

