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
from app.models.match import Match, MatchPlayer, MatchInvite
from app.models.player import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])

from pydantic import BaseModel

class MatchCreate(BaseModel):
    title: str
    turf: Optional[str] = None
    location: str
    date_time: datetime
    max_players: int = 22
    format: str = "11v11"
    password: Optional[str] = None
    discordLink: Optional[str] = None


def _serialize_match(match: Match) -> dict:
    """Serialize a Match ORM object to a plain dict including players."""
    players = []
    if match.players:
        for p in match.players:
            players.append({
                "id": p.id,
                "matchId": p.matchId,
                "userId": p.userId,
                "team": p.team,
                "status": p.status,
                "joinedAt": p.joinedAt.isoformat() if p.joinedAt else None,
            })

    return {
        "id": match.id,
        "shortId": match.shortId,
        "title": match.title,
        "turf": match.turf,
        "location": match.location,
        "format": match.format,
        "matchDate": match.matchDate.isoformat() if match.matchDate else None,
        "maxPlayers": match.maxPlayers,
        "status": match.status,
        "discordLink": match.discordLink,
        "hostId": match.hostId,
        "createdAt": match.createdAt.isoformat() if match.createdAt else None,
        "participants": players, # Keeping key as 'participants' for frontend compatibility if needed, or update frontend too
        "players": len(players),
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
        turf=match_in.turf,
        location=match_in.location,
        matchDate=match_in.date_time,
        format=match_in.format,
        maxPlayers=match_in.max_players,
        password=match_in.password,
        discordLink=match_in.discordLink,
        hostId=db_user.id
    )
    session.add(match)
    await session.commit()
    await session.refresh(match)

    # Automatically add creator as a player
    player = MatchPlayer(matchId=match.id, userId=db_user.id)
    session.add(player)
    await session.commit()

    # Re-fetch with players eagerly loaded
    stmt = select(Match).where(Match.id == match.id).options(selectinload(Match.players))
    fresh = await session.execute(stmt)
    match = fresh.scalars().first()

    return _serialize_match(match)


@router.get("/")
async def get_all_matches(session: AsyncSession = Depends(get_session)):
    statement = select(Match).options(selectinload(Match.players))
    result = await session.execute(statement)
    matches = result.scalars().all()
    return [_serialize_match(m) for m in matches]


@router.get("/{match_id}")
async def get_match_by_id(
    match_id: str,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Match).where(Match.id == match_id).options(selectinload(Match.players))
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
    stmt = select(MatchPlayer).where(
        MatchPlayer.matchId == match_id,
        MatchPlayer.userId == db_user.id
    )
    existing = await session.execute(stmt)
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Already joined this match")
        
    player = MatchPlayer(matchId=match_id, userId=db_user.id)
    session.add(player)
    await session.commit()
    await session.refresh(player)
    return {"success": True, "data": {
        "id": player.id,
        "matchId": player.matchId,
        "userId": player.userId,
        "team": player.team,
        "status": player.status,
    }}


class MatchJoinCode(BaseModel):
    code: str
    password: Optional[str] = None


@router.post("/join-by-code")
async def join_match_by_code(
    payload: MatchJoinCode,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    clerk_id = user.get("sub")
    result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find the match
    stmt = select(Match).where(Match.shortId == payload.code.upper()).options(selectinload(Match.players))
    match_result = await session.execute(stmt)
    match = match_result.scalars().first()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found with this code")

    if match.password and match.password != payload.password:
        raise HTTPException(status_code=401, detail="Incorrect password")

    if len(match.players) >= match.maxPlayers:
        raise HTTPException(status_code=400, detail="Match is already full")

    # Check if already joined
    stmt = select(MatchPlayer).where(
        MatchPlayer.matchId == match.id,
        MatchPlayer.userId == db_user.id
    )
    existing = await session.execute(stmt)
    if existing.scalars().first():
        return {"success": True, "matchId": match.id, "message": "Already joined"}

    player = MatchPlayer(matchId=match.id, userId=db_user.id)
    session.add(player)
    await session.commit()
    return {"success": True, "matchId": match.id}


class InviteCreate(BaseModel):
    receiverId: str


@router.get("/invites/me")
async def get_my_invites(
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    invites_result = await session.execute(
        select(MatchInvite)
        .where(MatchInvite.receiverId == db_user.id, MatchInvite.status == "pending")
        .options(selectinload(MatchInvite.match), selectinload(MatchInvite.sender))
    )
    invites = invites_result.scalars().all()
    
    return {
        "success": True, 
        "invites": [
            {
                "id": inv.id,
                "matchId": inv.matchId,
                "matchTitle": inv.match.title if inv.match else "Match",
                "senderId": inv.senderId,
                "senderName": inv.sender.fullName or inv.sender.username if inv.sender else "Someone",
                "senderAvatar": inv.sender.avatarUrl if inv.sender else None,
                "status": inv.status,
                "createdAt": inv.createdAt.isoformat() if inv.createdAt else None
            }
            for inv in invites
        ]
    }


@router.post("/{match_id}/invite")
async def invite_to_match(
    match_id: str,
    payload: InviteCreate,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    
    sender_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    sender = sender_result.scalars().first()
    if not sender:
        raise HTTPException(status_code=404, detail="Sender not found")

    match_result = await session.execute(select(Match).where(Match.id == match_id))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    receiver_result = await session.execute(select(User).where(User.id == payload.receiverId))
    receiver = receiver_result.scalars().first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    existing_invite_result = await session.execute(
        select(MatchInvite).where(
            MatchInvite.matchId == match_id,
            MatchInvite.receiverId == payload.receiverId
        )
    )
    if existing_invite_result.scalars().first():
        return {"success": True, "message": "Already invited"}

    invite = MatchInvite(
        matchId=match_id,
        senderId=sender.id,
        receiverId=payload.receiverId,
        status="pending"
    )
    session.add(invite)
    await session.commit()
    await session.refresh(invite)
    
    return {"success": True, "invite": {"id": invite.id, "matchId": invite.matchId, "status": invite.status}}


class MatchUpdate(BaseModel):
    discordLink: Optional[str] = None
    turf: Optional[str] = None


@router.patch("/{match_id}")
async def update_match(
    match_id: str,
    payload: MatchUpdate,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    match_result = await session.execute(select(Match).where(Match.id == match_id))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only the host can update the match")

    if payload.discordLink is not None:
        match.discordLink = payload.discordLink
    if payload.turf is not None:
        match.turf = payload.turf

    await session.commit()
    await session.refresh(match)
    return {"success": True, "data": _serialize_match(match)}


@router.post("/{match_id}/close")
async def close_match(
    match_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    match_result = await session.execute(select(Match).where(Match.id == match_id))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only the host can close the match")

    match.status = "closed"
    await session.commit()
    await session.refresh(match)
    return {"success": True, "data": _serialize_match(match)}
