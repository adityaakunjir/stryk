"""
STRYK Backend - Matches API

Endpoints for creating matches, joining, checking in, etc.
"""

from typing import List, Optional
from datetime import datetime, timedelta
import statistics
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select, delete

from app.core.database import get_session
from app.models.match import Match, MatchPlayer, MatchInvite, MatchStats, MatchVerification, XPLog, MatchTeam
from app.models.player import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])

from pydantic import BaseModel

class PlayerPositionData(BaseModel):
    playerId: str
    x: Optional[float] = None
    y: Optional[float] = None


class MatchCreate(BaseModel):
    title: str
    turf: Optional[str] = None
    location: str
    date_time: datetime
    max_players: int = 22
    format: str = "11v11"
    password: Optional[str] = None
    discordLink: Optional[str] = None
    teamA: Optional[List[PlayerPositionData]] = None
    teamB: Optional[List[PlayerPositionData]] = None


def _serialize_match(match: Match) -> dict:
    """Serialize a Match ORM object to a plain dict including players."""
    players = []
    if match.players:
        for p in match.players:
            player_dict = {
                "id": p.id,
                "matchId": p.matchId,
                "userId": p.userId,
                "team": p.team,
                "status": p.status,
                "x": p.x,
                "y": p.y,
                "checkedIn": p.status == "checked_in",
                "joinedAt": p.joinedAt.isoformat() if p.joinedAt else None,
            }
            if hasattr(p, "user") and p.user:
                player_dict["user"] = {
                    "id": p.user.id,
                    "clerkId": p.user.clerkId,
                    "username": p.user.username,
                    "firstName": getattr(p.user, "fullName", "").split(" ")[0] if getattr(p.user, "fullName", "") else getattr(p.user, "username", ""),
                    "lastName": getattr(p.user, "fullName", "").split(" ")[-1] if getattr(p.user, "fullName", "") and " " in getattr(p.user, "fullName", "") else "",
                    "avatarUrl": p.user.avatarUrl,
                    "position": p.user.position,
                    "playStyle": p.user.playStyle,
                    "overall": p.user.overall,
                    "xp": getattr(p.user, "xp", 0),
                    "level": getattr(p.user, "level", 1)
                }
            players.append(player_dict)

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
        "privacy": "private" if match.password else "public",
        "discordLink": match.discordLink,
        "hostId": match.hostId,
        "teamAName": match.teamAName,
        "teamBName": match.teamBName,
        "teamAScore": match.teamAScore,
        "teamBScore": match.teamBScore,
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

    try:
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

        # Add players from draft teams with position data
        all_players = []
        
        if match_in.teamA:
            for player_data in match_in.teamA:
                player = MatchPlayer(
                    matchId=match.id,
                    userId=player_data.playerId,
                    team="A",
                    x=player_data.x,
                    y=player_data.y
                )
                session.add(player)
                all_players.append(player)
        
        if match_in.teamB:
            for player_data in match_in.teamB:
                player = MatchPlayer(
                    matchId=match.id,
                    userId=player_data.playerId,
                    team="B",
                    x=player_data.x,
                    y=player_data.y
                )
                session.add(player)
                all_players.append(player)

        # If no teams provided, add creator as a player (legacy behavior)
        if not match_in.teamA and not match_in.teamB:
            player = MatchPlayer(matchId=match.id, userId=db_user.id)
            session.add(player)

        await session.commit()

        # Re-fetch with players eagerly loaded
        stmt = select(Match).where(Match.id == match.id).options(selectinload(Match.players).selectinload(MatchPlayer.user))
        fresh = await session.execute(stmt)
        match = fresh.scalars().first()

        return _serialize_match(match)
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"success": False, "detail": "Internal Server Error", "error": error_msg})


@router.get("/available-players")
async def get_available_players(
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Get list of all players available for draft (excluding current user)."""
    clerk_id = user.get("sub")
    result = await session.execute(select(User).where(User.clerkId == clerk_id))
    current_user = result.scalars().first()
    
    # Get all users except current user — capped at 100 for performance
    stmt = (
        select(User)
        .where(User.id != current_user.id if current_user else User.clerkId != clerk_id)
        .limit(100)
    )
    result = await session.execute(stmt)
    players = result.scalars().all()
    
    return {
        "success": True,
        "players": [
            {
                "playerId": p.id,
                "username": p.username,
                "position": p.position,
                "playStyle": p.playStyle,
                "overall": p.overall,
                "rating": p.overall,  # Alias for compatibility
                "xp": getattr(p, "xp", 0),
                "level": getattr(p, "level", 1),
                "wins": getattr(p, "wins", 0),
                "matches": getattr(p, "matches", 0),
                "strongFoot": getattr(p, "strongFoot", "right"),
                "avatarUrl": p.avatarUrl,
            }
            for p in players
        ]
    }



@router.get("/")
async def get_all_matches(
    session: AsyncSession = Depends(get_session),
    limit: int = 30,
    offset: int = 0,
):
    """Return only open matches, newest first, with pagination."""
    from sqlalchemy import desc
    statement = (
        select(Match)
        .where(Match.status == "open")
        .order_by(desc(Match.createdAt))
        .limit(limit)
        .offset(offset)
        .options(selectinload(Match.players).selectinload(MatchPlayer.user))
    )
    result = await session.execute(statement)
    matches = result.scalars().all()
    return [_serialize_match(m) for m in matches]


@router.get("/debug-players")
async def debug_players(session: AsyncSession = Depends(get_session)):
    user = (await session.execute(select(User))).scalars().first()
    if not user:
        return {"error": "no user"}
    matches = (await session.execute(select(Match).where(Match.hostId == user.id))).scalars().all()
    res = []
    for m in matches:
        players = (await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == m.id))).scalars().all()
        p = (await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == m.id, MatchPlayer.userId == user.id))).scalars().first()
        res.append({
            "matchId": m.id,
            "shortId": m.shortId,
            "players": [pl.userId for pl in players],
            "found_with_where": p.userId if p else None
        })
    return {"user": user.id, "matches": res}

@router.delete("/{match_id}")
async def delete_match(
    match_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    match_result = await session.execute(
        select(Match).where((Match.id == match_id) | (Match.shortId == match_id))
    )
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only the host can delete this match")

    # Manually cascade delete to prevent foreign key constraint failures
    await session.execute(delete(MatchPlayer).where(MatchPlayer.matchId == match.id))
    await session.execute(delete(MatchTeam).where(MatchTeam.matchId == match.id))
    await session.execute(delete(MatchInvite).where(MatchInvite.matchId == match.id))
    await session.execute(delete(MatchStats).where(MatchStats.matchId == match.id))
    await session.execute(delete(MatchVerification).where(MatchVerification.matchId == match.id))

    await session.delete(match)
    await session.commit()
    
    return {"success": True, "message": "Match deleted successfully"}

@router.get("/{match_id}")
async def get_match_by_id(
    match_id: str,
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Match).where(Match.id == match_id).options(selectinload(Match.players).selectinload(MatchPlayer.user))
    result = await session.execute(stmt)
    match = result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"success": True, "data": _serialize_match(match)}


class MatchJoinRequest(BaseModel):
    matchId: str
    password: Optional[str] = None

@router.post("/join")
async def join_match(
    payload: MatchJoinRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    clerk_id = user.get("sub")
    result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch Match
    stmt = select(Match).where(((Match.id == payload.matchId) | (Match.shortId == payload.matchId))).options(selectinload(Match.players).selectinload(MatchPlayer.user))
    match_res = await session.execute(stmt)
    match = match_res.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Validate Capacity
    if len(match.players) >= match.maxPlayers:
        raise HTTPException(status_code=400, detail="Match is already full")

    # Validate Password
    if match.password and match.password != payload.password:
        raise HTTPException(status_code=401, detail="Incorrect password")

    # Check if already joined
    stmt = select(MatchPlayer).where(
        MatchPlayer.matchId == match.id,
        MatchPlayer.userId == db_user.id
    )
    existing = await session.execute(stmt)
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Already joined this match")
        
    player = MatchPlayer(matchId=match.id, userId=db_user.id)
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
    stmt = select(Match).where(Match.shortId == payload.code.upper()).options(selectinload(Match.players).selectinload(MatchPlayer.user))
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


@router.post("/invites/{invite_id}/accept")
async def accept_match_invite(
    invite_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    invite_result = await session.execute(
        select(MatchInvite).where(MatchInvite.id == invite_id).options(selectinload(MatchInvite.match))
    )
    invite = invite_result.scalars().first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite.receiverId != db_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this invite")

    if invite.status != "pending":
        raise HTTPException(status_code=400, detail="Invite is no longer pending")

    match = invite.match
    if not match:
        raise HTTPException(status_code=404, detail="Associated match not found")

    # Refresh match to get players count
    await session.refresh(match, ["players"])

    # Capacity Check
    if len(match.players) >= match.maxPlayers:
        raise HTTPException(status_code=400, detail="Match is already full")

    # Check if already joined
    stmt = select(MatchPlayer).where(
        MatchPlayer.matchId == match.id,
        MatchPlayer.userId == db_user.id
    )
    existing = await session.execute(stmt)
    if existing.scalars().first():
        invite.status = "accepted"
        await session.commit()
        return {"success": True, "message": "Already joined"}

    player = MatchPlayer(matchId=match.id, userId=db_user.id)
    invite.status = "accepted"
    session.add(player)
    await session.commit()
    return {"success": True, "matchId": match.id}


@router.post("/invites/{invite_id}/decline")
async def decline_match_invite(
    invite_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    invite_result = await session.execute(select(MatchInvite).where(MatchInvite.id == invite_id))
    invite = invite_result.scalars().first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")

    if invite.receiverId != db_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to decline this invite")

    invite.status = "declined"
    await session.commit()
    return {"success": True}



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

    match_result = await session.execute(select(Match).where(Match.id == match_id).options(selectinload(Match.players).selectinload(MatchPlayer.user)))
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





class LeaveMatchRequest(BaseModel):
    matchId: str

@router.post("/leave")
async def leave_match(
    payload: LeaveMatchRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    match_result = await session.execute(
        select(Match).where((((Match.id == payload.matchId) | (Match.shortId == payload.matchId))) | (Match.shortId == payload.matchId))
    )
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.matchId == match.id, MatchPlayer.userId == db_user.id)
    )
    player = player_result.scalars().first()
    print(f"DEBUG LEAVE: matchId={match.id}, db_user.id={db_user.id}, player={player}")
    if not player:
        # Fetch all players for this match just to see
        all_players_res = await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == match.id))
        all_players = all_players_res.scalars().all()
        debug_msg = f"You are not in this match. Match: {match.id}, You: {db_user.id}, Players: {[p.userId for p in all_players]}"
        raise HTTPException(status_code=400, detail=debug_msg)

    await session.delete(player)
    await session.commit()
    
    # Clean up empty matches
    all_players_res = await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == match.id))
    remaining = all_players_res.scalars().all()
    if not remaining:
        await session.delete(match)
        await session.commit()

    return {"success": True, "message": "Successfully left the match"}


class KickPlayerRequest(BaseModel):
    userId: str

@router.post("/{match_id}/kick")
async def kick_player(
    match_id: str,
    payload: KickPlayerRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    
    match_result = await session.execute(select(Match).where(Match.id == match_id))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only the host can kick players")

    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.matchId == match_id, MatchPlayer.userId == payload.userId)
    )
    player = player_result.scalars().first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not in match")
        
    await session.delete(player)
    await session.commit()
    return {"success": True, "message": "Player kicked"}


@router.post("/{match_id}/start")
async def start_match(
    match_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    
    match_result = await session.execute(
        select(Match).where(Match.id == match_id).options(selectinload(Match.players).selectinload(MatchPlayer.user))
    )
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only the host can start the match")

    match.status = "in_progress"
    await session.commit()
    await session.refresh(match)
    return {"success": True, "data": _serialize_match(match)}


class CheckInRequest(BaseModel):
    matchId: str

@router.post("/check-in")
async def check_in(
    payload: CheckInRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    
    match_result = await session.execute(
        select(Match).where((Match.id == payload.matchId) | (Match.shortId == payload.matchId))
    )
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.matchId == match.id, MatchPlayer.userId == db_user.id)
    )
    player = player_result.scalars().first()
    if not player:
        raise HTTPException(status_code=400, detail="You are not in this match")
        
    player.status = "checked_in"
    await session.commit()
    
    match_result = await session.execute(select(Match).where(((Match.id == payload.matchId) | (Match.shortId == payload.matchId))).options(selectinload(Match.players).selectinload(MatchPlayer.user)))
    match = match_result.scalars().first()
    return {"success": True, "data": _serialize_match(match)}


class AssignTeamRequest(BaseModel):
    matchId: str
    participantId: str
    team: Optional[str] = None

@router.post("/assign-team")
async def assign_team(
    payload: AssignTeamRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    
    match_result = await session.execute(select(Match).where(((Match.id == payload.matchId) | (Match.shortId == payload.matchId))))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.id == payload.participantId)
    )
    player = player_result.scalars().first()
    if not player:
        raise HTTPException(status_code=404, detail="Participant not found")
        
    if match.hostId != db_user.id and player.userId != db_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to assign this team")
        
    player.team = payload.team
    await session.commit()
    
    match_result = await session.execute(select(Match).where(((Match.id == payload.matchId) | (Match.shortId == payload.matchId))).options(selectinload(Match.players).selectinload(MatchPlayer.user)))
    match = match_result.scalars().first()
    return {"success": True, "data": _serialize_match(match)}


class BalanceRequest(BaseModel):
    matchId: str

@router.post("/balance")
async def balance_teams(
    payload: BalanceRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    
    match_result = await session.execute(select(Match).where(((Match.id == payload.matchId) | (Match.shortId == payload.matchId))).options(selectinload(Match.players).selectinload(MatchPlayer.user)))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only host can balance teams")

    players = match.players
    # Sort by overall descending
    players_sorted = sorted(players, key=lambda p: p.user.overall if p.user and p.user.overall else 60, reverse=True)
    
    team_a = []
    team_b = []
    
    for i, p in enumerate(players_sorted):
        if i % 2 == 0:
            p.team = "Team A"
            team_a.append(p)
        else:
            p.team = "Team B"
            team_b.append(p)
            
    await session.commit()
    
    avg_a = sum(p.user.overall or 60 for p in team_a) / len(team_a) if team_a else 0
    avg_b = sum(p.user.overall or 60 for p in team_b) / len(team_b) if team_b else 0
    
    return {
        "success": True, 
        "data": {
            "avgA": round(avg_a, 1),
            "avgB": round(avg_b, 1),
            "ratingDiff": round(abs(avg_a - avg_b), 1),
            "match": _serialize_match(match)
        }
        }



class UpdateTeamNamesRequest(BaseModel):
    teamAName: Optional[str] = None
    teamBName: Optional[str] = None

@router.patch("/{match_id}/team-names")
async def update_team_names(
    match_id: str,
    payload: UpdateTeamNamesRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    match_result = await session.execute(select(Match).where(Match.id == match_id))
    match = match_result.scalars().first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if payload.teamAName is not None:
        match.teamAName = payload.teamAName
    if payload.teamBName is not None:
        match.teamBName = payload.teamBName
        
    await session.commit()
    return {"success": True, "message": "Team names updated"}



class PositionData(BaseModel):
    id: str
    team: Optional[str]
    x: Optional[float]
    y: Optional[float]

class SaveTeamsRequest(BaseModel):
    teamA: List[str] = []  # List of user IDs (optional, for backward compatibility)
    teamB: List[str] = []  # List of user IDs (optional, for backward compatibility)
    positions: List[PositionData] = []

@router.post("/{match_id}/save-teams")
async def save_teams(
    match_id: str,
    payload: SaveTeamsRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    
    match_result = await session.execute(select(Match).where(Match.id == match_id).options(selectinload(Match.players).selectinload(MatchPlayer.user)))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    is_host = (match.hostId == db_user.id)

    players = match.players
    
    # Map positions if provided
    positions_map = {p.id: p for p in payload.positions}
    
    # Update teams based on the payload
    for p in players:
        # Security: Non-hosts can only update their own position/team
        if not is_host and p.userId != db_user.id:
            continue
            
        if p.userId in positions_map:
            pos_data = positions_map[p.userId]
            if pos_data.team == "Team A" or pos_data.team == "A":
                p.team = "A"
            elif pos_data.team == "Team B" or pos_data.team == "B":
                p.team = "B"
            else:
                p.team = None
            p.x = pos_data.x
            p.y = pos_data.y
        elif p.userId in payload.teamA:
            p.team = "A"
        elif p.userId in payload.teamB:
            p.team = "B"
        else:
            p.team = None
            
    await session.commit()
    
    # We should trigger Pusher event here via frontend proxy or server
    
    return {
        "success": True, 
        "message": "Teams saved successfully",
        "data": _serialize_match(match)
    }

class UpdatePositionRequest(BaseModel):
    userId: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    team: Optional[str] = None

@router.post("/{match_id}/update-position")
async def update_position(
    match_id: str,
    payload: UpdatePositionRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    """Allow any participant to update their own position on the pitch, and host to update anyone's."""
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user_id = payload.userId or db_user.id
    
    match_result = await session.execute(select(Match).where(Match.id == match_id))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    is_host = (match.hostId == db_user.id)
    if not is_host and target_user_id != db_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update another player's position")

    # Find the target user's MatchPlayer record
    player_result = await session.execute(
        select(MatchPlayer).where(
            MatchPlayer.matchId == match_id,
            MatchPlayer.userId == target_user_id
        )
    )
    player = player_result.scalars().first()
    if not player:
        raise HTTPException(status_code=404, detail="Participant not found")

    # Normalize team value
    if payload.team in ("Team A", "A"):
        player.team = "A"
    elif payload.team in ("Team B", "B"):
        player.team = "B"
    else:
        player.team = None

    player.x = payload.x
    player.y = payload.y
    await session.commit()

    return {
        "success": True,
        "data": {
            "userId": db_user.id,
            "x": player.x,
            "y": player.y,
            "team": player.team,
        }
    }


class SubmitStatsRequest(BaseModel):
    goals: int = 0
    assists: int = 0
    shotsOnTarget: int = 0
    keyPasses: int = 0
    interceptions: int = 0
    ballRecoveries: int = 0
    progressivePasses: int = 0
    tackles: int = 0
    blocks: int = 0
    clearances: int = 0
    saves: int = 0
    bigSaves: int = 0
    penaltySaves: int = 0
    distributionAssists: int = 0
    duelsWon: int = 0
    aerialDuelsWon: int = 0
    cleanSheet: bool = False
    motm: bool = False
    yellowCards: int = 0
    redCards: int = 0
    ownGoals: int = 0
    noShow: bool = False

class MatchClosePayload(BaseModel):
    teamAScore: Optional[int] = None
    teamBScore: Optional[int] = None

@router.post("/{match_id}/close")
async def close_match(
    match_id: str,
    payload: Optional[MatchClosePayload] = None,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    match_result = await session.execute(select(Match).where(Match.id == match_id).options(selectinload(Match.players).selectinload(MatchPlayer.user)))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only the host can close the match")

    match.status = "closed"
    if payload:
        if payload.teamAScore is not None:
            match.teamAScore = payload.teamAScore
        if payload.teamBScore is not None:
            match.teamBScore = payload.teamBScore

    await session.commit()
    await session.refresh(match)
    return {"success": True, "data": _serialize_match(match)}

@router.post("/{match_id}/submit-stats")
async def submit_stats(
    match_id: str,
    payload: SubmitStatsRequest,
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

    if match.status != "closed":
        raise HTTPException(status_code=400, detail="Stats can only be submitted after the match is closed")

    # Check 24 hour window
    # if match.createdAt and (datetime.utcnow() - match.createdAt).total_seconds() > 86400:
    #     raise HTTPException(status_code=400, detail="Stat submission window (24 hours) has expired")

    # Verify user was in the match
    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.matchId == match_id, MatchPlayer.userId == db_user.id)
    )
    if not player_result.scalars().first():
        raise HTTPException(status_code=403, detail="You were not part of this match")

    # Check if stats already submitted
    existing_stats_result = await session.execute(
        select(MatchStats).where(MatchStats.matchId == match_id, MatchStats.userId == db_user.id)
    )
    if existing_stats_result.scalars().first():
        raise HTTPException(status_code=400, detail="Stats already submitted for this match")

    # 1. Velocity Cap: Max 3 matches per 24 hours
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    velocity_result = await session.execute(
        select(MatchStats).where(MatchStats.userId == db_user.id, MatchStats.createdAt >= twenty_four_hours_ago)
    )
    velocity_count = len(velocity_result.scalars().all())
    if velocity_count >= 3:
        raise HTTPException(status_code=400, detail="Velocity limit exceeded: You have already submitted stats for 3 matches in the last 24 hours.")

    # 2. Stat Cap Validation
    if payload.goals > 50 or payload.assists > 50 or payload.saves > 50:
        raise HTTPException(status_code=400, detail="Submitted stats exceed realistic limits (max 50 for goals/assists/saves).")
    if payload.tackles > 100 or payload.interceptions > 100 or payload.ballRecoveries > 100:
        raise HTTPException(status_code=400, detail="Submitted stats exceed realistic limits (max 100 for defensive actions).")
    if payload.yellowCards > 2 or payload.redCards > 1:
        raise HTTPException(status_code=400, detail="Invalid discipline stats.")

    # 3. Outlier Flagging
    is_flagged = False
    flag_reason = None
    
    historical_stats_result = await session.execute(
        select(MatchStats).where(MatchStats.userId == db_user.id)
    )
    historical_stats = historical_stats_result.scalars().all()
    
    if len(historical_stats) >= 5:
        # Check goals
        hist_goals = [s.goals for s in historical_stats]
        avg_goals = sum(hist_goals) / len(hist_goals)
        std_goals = statistics.stdev(hist_goals) if len(hist_goals) > 1 else 0
        
        # Check assists
        hist_assists = [s.assists for s in historical_stats]
        avg_assists = sum(hist_assists) / len(hist_assists)
        std_assists = statistics.stdev(hist_assists) if len(hist_assists) > 1 else 0
        
        # We only flag if it exceeds 2 stddev AND is a meaningful number (e.g. > 2 goals)
        if payload.goals > 2 and payload.goals > (avg_goals + 2 * std_goals):
            is_flagged = True
            flag_reason = f"Outlier detected: {payload.goals} goals submitted, historical average {avg_goals:.1f} (stddev {std_goals:.1f})."
        elif payload.assists > 2 and payload.assists > (avg_assists + 2 * std_assists):
            is_flagged = True
            flag_reason = f"Outlier detected: {payload.assists} assists submitted, historical average {avg_assists:.1f} (stddev {std_assists:.1f})."

    # Format goals caps (soft cap for stat progression calculations, but we keep the raw submitted stats below)
    format_caps = {
        "3v3": 4,
        "5v5": 5,
        "7v7": 5,
        "11v11": 6
    }
    cap = format_caps.get(match.format, 6)

    goals = min(payload.goals, cap)
    assists = payload.assists
    yellow_cards = min(payload.yellowCards, 2)
    red_cards = min(payload.redCards, 1)
    
    clean_sheet = payload.cleanSheet

    stats = MatchStats(
        matchId=match_id,
        userId=db_user.id,
        goals=goals,
        assists=assists,
        shotsOnTarget=payload.shotsOnTarget,
        keyPasses=payload.keyPasses,
        interceptions=payload.interceptions,
        ballRecoveries=payload.ballRecoveries,
        progressivePasses=payload.progressivePasses,
        tackles=payload.tackles,
        blocks=payload.blocks,
        clearances=payload.clearances,
        saves=payload.saves,
        bigSaves=payload.bigSaves,
        penaltySaves=payload.penaltySaves,
        distributionAssists=payload.distributionAssists,
        duelsWon=payload.duelsWon,
        aerialDuelsWon=payload.aerialDuelsWon,
        cleanSheet=clean_sheet,
        motm=payload.motm,
        yellowCards=yellow_cards,
        redCards=red_cards,
        ownGoals=payload.ownGoals,
        noShow=payload.noShow,
        status="pending_verification",
        isFlagged=is_flagged,
        flagReason=flag_reason
    )

    session.add(stats)
    await session.commit()
    await session.refresh(stats)

    return {
        "success": True,
        "message": "Stats submitted successfully and are pending verification",
        "data": {
            "id": stats.id,
            "status": stats.status
        }
    }


@router.get("/{match_id}/my-stats")
async def get_my_match_stats(
    match_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    stats_result = await session.execute(
        select(MatchStats).where(MatchStats.matchId == match_id, MatchStats.userId == db_user.id)
    )
    stats = stats_result.scalars().first()
    
    if not stats:
        return {"success": True, "hasSubmitted": False}
        
    return {
        "success": True,
        "hasSubmitted": True,
        "data": {
            "id": stats.id,
            "goals": stats.goals,
            "assists": stats.assists,
            "saves": stats.saves,
            "tackles": stats.tackles,
            "cleanSheet": stats.cleanSheet,
            "motm": stats.motm,
            "yellowCards": stats.yellowCards,
            "redCards": stats.redCards,
            "status": stats.status
        }
    }


@router.post("/{match_id}/reconcile")
async def reconcile_match_stats(
    match_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    match_result = await session.execute(
        select(Match).where(Match.id == match_id).options(selectinload(Match.stats))
    )
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.status != "closed":
        raise HTTPException(status_code=400, detail="Match is not closed")

    stats = match.stats
    if not stats:
        return {"success": True, "message": "No stats submitted yet"}

    total_claimed_goals = sum(s.goals for s in stats)

    approx_match_total = total_claimed_goals
    if match.teamAScore is not None and match.teamBScore is not None:
        actual_total = match.teamAScore + match.teamBScore
        approx_match_total = max(approx_match_total, actual_total)

    flagged_count = 0
    for s in stats:
        if s.assists > approx_match_total:
            s.status = "flagged_peer_verification"
            s.verificationNote = f"Assist count ({s.assists}) exceeds match goal total ({approx_match_total})."
            flagged_count += 1

    await session.commit()

    return {
        "success": True,
        "message": f"Reconciliation complete. Flagged {flagged_count} outlier stats.",
        "flaggedCount": flagged_count
    }

# --- Peer Verification Endpoints ---

@router.get("/{match_id}/pending-verifications")
async def get_pending_verifications(
    match_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get match stats submitted by OTHER players, which haven't been verified by current user
    # and are still in pending_verification status.
    stats_result = await session.execute(
        select(MatchStats)
        .where(MatchStats.matchId == match_id)
        .where(MatchStats.userId != db_user.id)
        .where(MatchStats.status.in_(["pending_verification", "flagged_peer_verification"]))
        .options(selectinload(MatchStats.user))
    )
    all_other_stats = stats_result.scalars().all()

    # Get verifications already made by this user
    verifications_result = await session.execute(
        select(MatchVerification)
        .where(MatchVerification.matchId == match_id)
        .where(MatchVerification.verifierId == db_user.id)
    )
    already_verified_target_ids = {v.targetPlayerId for v in verifications_result.scalars().all()}

    pending = []
    for stat in all_other_stats:
        if stat.userId not in already_verified_target_ids:
            pending.append({
                "id": stat.id,
                "userId": stat.userId,
                "username": stat.user.username,
                "avatarUrl": stat.user.avatarUrl,
                "goals": stat.goals,
                "assists": stat.assists,
                "saves": stat.saves,
                "tackles": stat.tackles,
                "cleanSheet": stat.cleanSheet,
                "motm": stat.motm,
                "yellowCards": stat.yellowCards,
                "redCards": stat.redCards,
                "status": stat.status,
                "verificationNote": stat.verificationNote
            })

    return {"success": True, "data": pending}


class VerifyStatsRequest(BaseModel):
    targetPlayerId: str
    vote: int  # 1 for approve, -1 for dispute
    disputeReason: Optional[str] = None

@router.post("/{match_id}/verify")
async def verify_stats(
    match_id: str,
    payload: VerifyStatsRequest,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.targetPlayerId == db_user.id:
        raise HTTPException(status_code=400, detail="Cannot verify your own stats")

    # Check if already verified
    existing_result = await session.execute(
        select(MatchVerification)
        .where(MatchVerification.matchId == match_id)
        .where(MatchVerification.verifierId == db_user.id)
        .where(MatchVerification.targetPlayerId == payload.targetPlayerId)
    )
    if existing_result.scalars().first():
        raise HTTPException(status_code=400, detail="Already voted on this player's stats")

    # Check if stats exist
    stat_result = await session.execute(
        select(MatchStats)
        .where(MatchStats.matchId == match_id)
        .where(MatchStats.userId == payload.targetPlayerId)
    )
    if not stat_result.scalars().first():
        raise HTTPException(status_code=404, detail="Stats not found for target player")

    if payload.vote == -1 and not payload.disputeReason:
        raise HTTPException(status_code=400, detail="Dispute reason is required")

    verification = MatchVerification(
        matchId=match_id,
        targetPlayerId=payload.targetPlayerId,
        verifierId=db_user.id,
        vote=payload.vote,
        disputeReason=payload.disputeReason
    )
    session.add(verification)
    await session.commit()

    return {"success": True, "message": "Vote recorded"}


@router.post("/{match_id}/complete")
async def complete_match(
    match_id: str,
    user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # This would usually be called by a cron job, but we'll expose it for manual/host triggering
    clerk_id = user.get("sub")
    db_user_result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = db_user_result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    match_result = await session.execute(
        select(Match).where(Match.id == match_id).options(selectinload(Match.players).selectinload(MatchPlayer.user))
    )
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.status != "closed":
        raise HTTPException(status_code=400, detail="Match is not closed")

    # Total players in match
    total_players = len(match.players)
    if total_players <= 1:
        return {"success": True, "message": "Not enough players to verify"}

    N = total_players - 1  # Total OTHER players
    quorum_threshold = 0.6 * N

    stats_result = await session.execute(
        select(MatchStats)
        .where(MatchStats.matchId == match_id)
        .options(selectinload(MatchStats.user))
    )
    all_stats = stats_result.scalars().all()

    verifications_result = await session.execute(
        select(MatchVerification).where(MatchVerification.matchId == match_id)
    )
    all_verifications = verifications_result.scalars().all()

    results = []
    
    for stat in all_stats:
        if stat.status in ["verified", "voided"]:
            continue # already finalized
            
        target_id = stat.userId
        votes_for_target = [v for v in all_verifications if v.targetPlayerId == target_id]
        
        total_votes = len(votes_for_target)
        approvals = sum(1 for v in votes_for_target if v.vote == 1)
        
        if total_votes >= quorum_threshold:
            if approvals >= quorum_threshold:
                stat.status = "verified"
                # Calculate Base XP
                is_win = False
                is_draw = False
                if match.teamAScore is not None and match.teamBScore is not None:
                    is_win = (match.teamAScore > match.teamBScore and stat.user.id in [p.userId for p in match.players if p.team == "A"]) or \
                             (match.teamBScore > match.teamAScore and stat.user.id in [p.userId for p in match.players if p.team == "B"])
                    is_draw = match.teamAScore == match.teamBScore

                xp_award = 50 # Join Match
                if not stat.noShow:
                    xp_award += 30 # Finish Match
                
                if is_win:
                    xp_award += 50
                elif is_draw:
                    xp_award += 20
                
                xp_award += 20 # Verified Stats
                if stat.motm:
                    xp_award += 40
                
                # Performance XP
                xp_award += (stat.goals * 25)
                xp_award += (stat.assists * 18)
                xp_award += (stat.shotsOnTarget * 5)
                xp_award += (stat.keyPasses * 8)
                xp_award += (stat.interceptions * 8)
                xp_award += (stat.ballRecoveries * 6)
                xp_award += (stat.progressivePasses * 6)
                xp_award += (stat.tackles * 10)
                xp_award += (stat.blocks * 9)
                xp_award += (stat.clearances * 6)
                if stat.cleanSheet:
                    xp_award += 25
                xp_award += (stat.saves * 12)
                xp_award += (stat.bigSaves * 18)
                xp_award += (stat.penaltySaves * 30)
                xp_award += (stat.distributionAssists * 15)
                xp_award += (stat.duelsWon * 5)
                xp_award += (stat.aerialDuelsWon * 6)
                
                # Discipline XP
                xp_award -= (stat.yellowCards * 10)
                xp_award -= (stat.redCards * 25)
                xp_award -= (stat.ownGoals * 20)
                if stat.noShow:
                    xp_award -= 40
                
                # Update User XP and Level
                stat.user.xp += max(0, xp_award)
                new_level = (stat.user.xp // 1000) + 1
                if new_level > stat.user.level:
                    # Check threshold for frame change
                    if (stat.user.level <= 5 and new_level >= 6) or (stat.user.level <= 15 and new_level >= 16):
                        stat.user.needsUpgradeAnimation = True
                    stat.user.level = new_level

                # Update Raw Stats
                stat.user.matchesPlayed += 1
                if is_win:
                    stat.user.wins += 1
                elif is_draw:
                    stat.user.draws += 1
                else:
                    stat.user.losses += 1
                    
                stat.user.goals += stat.goals
                stat.user.assists += stat.assists
                stat.user.tackles += stat.tackles
                stat.user.saves += stat.saves
                stat.user.intercepts += stat.interceptions

                # Update User OVR Attributes using Diminishing Returns
                from app.core.stats import calculate_stat_gain, calculate_ovr

                # Goals -> SHO, PAC (small)
                for _ in range(stat.goals):
                    stat.user.shooting += calculate_stat_gain(4.5, stat.user.shooting)
                    stat.user.pace += calculate_stat_gain(1.5, stat.user.pace)
                
                # Assists -> PAS, DRI
                for _ in range(stat.assists):
                    stat.user.passing += calculate_stat_gain(3.5, stat.user.passing)
                    stat.user.dribbling += calculate_stat_gain(1.5, stat.user.dribbling)
                
                # Tackles -> DEF
                for _ in range(stat.tackles):
                    stat.user.defending += calculate_stat_gain(4.0, stat.user.defending)
                
                # Interceptions -> DEF, PAS (small)
                for _ in range(stat.interceptions):
                    stat.user.defending += calculate_stat_gain(3.0, stat.user.defending)
                    stat.user.passing += calculate_stat_gain(1.0, stat.user.passing)
                
                # Saves -> gkDiving, gkReflexes, gkHandling
                for _ in range(stat.saves):
                    stat.user.gkDiving += calculate_stat_gain(1.5, stat.user.gkDiving)
                    stat.user.gkReflexes += calculate_stat_gain(1.5, stat.user.gkReflexes)
                    stat.user.gkHandling += calculate_stat_gain(0.5, stat.user.gkHandling)
                
                # Distribution Assists -> gkKicking
                for _ in range(stat.distributionAssists):
                    stat.user.gkKicking += calculate_stat_gain(4.0, stat.user.gkKicking)
                
                # Duels won -> PHY
                for _ in range(stat.duelsWon):
                    stat.user.physical += calculate_stat_gain(2.0, stat.user.physical)
                
                # Key passes -> PAS
                for _ in range(stat.keyPasses):
                    stat.user.passing += calculate_stat_gain(2.5, stat.user.passing)
                
                # Blocks -> DEF
                for _ in range(stat.blocks):
                    stat.user.defending += calculate_stat_gain(3.0, stat.user.defending)
                
                # Clearances -> DEF
                for _ in range(stat.clearances):
                    stat.user.defending += calculate_stat_gain(2.0, stat.user.defending)
                
                # Clean sheets -> DEF, PHY, gkPositioning
                if stat.cleanSheet:
                    stat.user.defending += calculate_stat_gain(5.0, stat.user.defending)
                    stat.user.physical += calculate_stat_gain(3.0, stat.user.physical)
                    if stat.user.position == "GK":
                        stat.user.gkPositioning += calculate_stat_gain(5.0, stat.user.gkPositioning)
                
                # Cap attributes at 99.0
                stat.user.pace = min(99.0, stat.user.pace)
                stat.user.shooting = min(99.0, stat.user.shooting)
                stat.user.passing = min(99.0, stat.user.passing)
                stat.user.dribbling = min(99.0, stat.user.dribbling)
                stat.user.defending = min(99.0, stat.user.defending)
                stat.user.physical = min(99.0, stat.user.physical)
                stat.user.gkDiving = min(99.0, stat.user.gkDiving)
                stat.user.gkHandling = min(99.0, stat.user.gkHandling)
                stat.user.gkKicking = min(99.0, stat.user.gkKicking)
                stat.user.gkReflexes = min(99.0, stat.user.gkReflexes)
                stat.user.gkPositioning = min(99.0, stat.user.gkPositioning)
                
                # Recalculate Overall
                stats_dict = {
                    "pace": stat.user.pace,
                    "shooting": stat.user.shooting,
                    "passing": stat.user.passing,
                    "dribbling": stat.user.dribbling,
                    "defending": stat.user.defending,
                    "physical": stat.user.physical,
                    "gkDiving": stat.user.gkDiving,
                    "gkHandling": stat.user.gkHandling,
                    "gkKicking": stat.user.gkKicking,
                    "gkReflexes": stat.user.gkReflexes,
                    "gkPositioning": stat.user.gkPositioning
                }
                stat.user.overall = calculate_ovr(stat.user.position, stats_dict)


                log = XPLog(userId=target_id, matchId=match_id, amount=xp_award, reason="Match Stats Verified")
                session.add(log)
            else:
                stat.status = "voided"
        else:
            # Under 60% responded after 24 hrs
            stat.status = "voided"
            
        results.append({"userId": target_id, "status": stat.status})

    match.status = "completed"
    await session.commit()
    return {"success": True, "message": "Match completed successfully and stats recorded.", "results": results}
