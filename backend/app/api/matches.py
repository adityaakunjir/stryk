"""
STRYK Backend - Matches API

Endpoints for creating matches, joining, checking in, etc.
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.models.match import Match, MatchParticipant
from app.models.player import User
from app.api.teams import get_current_user_placeholder

router = APIRouter(prefix="/matches", tags=["matches"])


from pydantic import BaseModel

class MatchCreate(BaseModel):
    title: str
    location: str
    date_time: datetime
    max_players: int = 22

@router.post("/", response_model=Match, status_code=status.HTTP_201_CREATED)
async def create_match(
    match_in: MatchCreate,
    current_user: User = Depends(get_current_user_placeholder),
    session: AsyncSession = Depends(get_session),
):
    match = Match(
        title=match_in.title,
        location=match_in.location,
        dateTime=match_in.date_time,
        maxPlayers=match_in.max_players,
        creatorId=current_user.id
    )
    session.add(match)
    await session.commit()
    await session.refresh(match)
    return match


@router.get("/", response_model=List[Match])
async def get_all_matches(session: AsyncSession = Depends(get_session)):
    statement = select(Match)
    matches = await session.execute(statement)
    return matches.scalars().all()


@router.post("/{match_id}/join", response_model=MatchParticipant)
async def join_match(
    match_id: str,
    current_user: User = Depends(get_current_user_placeholder),
    session: AsyncSession = Depends(get_session),
):
    # Check if already joined
    stmt = select(MatchParticipant).where(
        MatchParticipant.matchId == match_id,
        MatchParticipant.userId == current_user.id
    )
    existing = await session.execute(stmt)
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Already joined this match")
        
    participant = MatchParticipant(matchId=match_id, userId=current_user.id)
    session.add(participant)
    await session.commit()
    await session.refresh(participant)
    return participant
