"""
STRYK Backend - Matches API

Endpoints for creating matches, joining, checking in, etc.
"""

from typing import List, Optional, Literal
from datetime import datetime, timedelta
import statistics
import math
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from sqlmodel import select

from app.core.database import get_session
from app.models.match import Match, MatchPlayer, MatchInvite, MatchStats, MatchVerification, XPLog, MatchTeam
from app.models.player import User
from app.core.auth import get_current_user

router = APIRouter(prefix="/matches", tags=["matches"])

from pydantic import BaseModel


def _card_frame_for_level(level: int) -> str:
    if level >= 16:
        return "gold"
    if level >= 6:
        return "silver"
    return "bronze"


def _sync_user_card_aliases(user: User) -> None:
    """Keep legacy app fields and explicit card-contract aliases in sync."""
    if not user.userId:
        user.userId = user.id
    if (user.matchesPlayed or 0) == 0:
        user.overall = 60
    user.avatar = user.avatarUrl
    user.OVR = user.overall
    user.PAC = user.pace
    user.SHO = user.shooting
    user.PAS = user.passing
    user.DRI = user.dribbling
    user.DEF = user.defending
    user.PHY = user.physical
    user.cardFrame = _card_frame_for_level(user.level or 1)


def _append_match_notification(match: Match, user_id: str, kind: str, message: str, deadline: Optional[datetime] = None) -> None:
    notifications = list(match.notifications or [])
    notifications.append({
        "userId": user_id,
        "kind": kind,
        "message": message,
        "deadline": deadline.isoformat() if deadline else None,
        "createdAt": datetime.utcnow().isoformat(),
        "read": False,
    })
    match.notifications = notifications


def _opponent_summary(match: Match, player_team: Optional[str]) -> dict:
    if player_team == "A":
        return {
            "team": match.teamBName,
            "scoreFor": match.teamAScore,
            "scoreAgainst": match.teamBScore,
        }
    if player_team == "B":
        return {
            "team": match.teamAName,
            "scoreFor": match.teamBScore,
            "scoreAgainst": match.teamAScore,
        }
    return {
        "team": "Unassigned",
        "scoreFor": None,
        "scoreAgainst": None,
    }


def _match_result_for_team(match: Match, player_team: Optional[str]) -> str:
    if match.teamAScore is None or match.teamBScore is None or not player_team:
        return "draw"
    if match.teamAScore == match.teamBScore:
        return "draw"
    if player_team == "A":
        return "win" if match.teamAScore > match.teamBScore else "loss"
    if player_team == "B":
        return "win" if match.teamBScore > match.teamAScore else "loss"
    return "draw"


def _append_user_history(
    user: User,
    match: Match,
    player_team: Optional[str],
    goals: int,
    assists: int,
    verified_by_count: int,
) -> None:
    history = list(user.matchHistory or [])
    public_match_id = match.matchId or match.id
    if any(entry.get("matchId") == public_match_id for entry in history):
        return
    history.append({
        "matchId": public_match_id,
        "date": (match.matchDate or match.createdAt).isoformat(),
        "format": match.format,
        "result": _match_result_for_team(match, player_team),
        "goals": goals,
        "assists": assists,
        "verifiedBy": verified_by_count,
        "opponentSummary": _opponent_summary(match, player_team),
    })
    user.matchHistory = history

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
                    "playstyle": p.user.playStyle,
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
        "scheduledAt": match.scheduledAt.isoformat() if match.scheduledAt else (match.matchDate.isoformat() if match.matchDate else None),
        "completedAt": match.completedAt.isoformat() if match.completedAt else None,
        "submissionDeadline": match.submissionDeadline.isoformat() if match.submissionDeadline else None,
        "verificationDeadline": match.verificationDeadline.isoformat() if match.verificationDeadline else None,
        "matchId": match.matchId or match.id,
        "hostUserId": match.hostUserId or match.hostId,
        "notifications": match.notifications or [],
        "participants": players, # Keeping key as 'participants' for frontend compatibility if needed, or update frontend too
        "playersArray": players,
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
            matchId=None,
            title=match_in.title,
            turf=match_in.turf,
            location=match_in.location,
            matchDate=match_in.date_time,
            scheduledAt=match_in.date_time,
            format=match_in.format,
            maxPlayers=match_in.max_players,
            password=match_in.password,
            discordLink=match_in.discordLink,
            hostId=db_user.id,
            hostUserId=db_user.id
        )
        session.add(match)
        await session.flush()
        match.matchId = match.id
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

        participant_count = len(all_players) if all_players else 1
        if participant_count >= match.maxPlayers:
            match.status = "full"
            session.add(match)

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
                "playstyle": p.playStyle,
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
        raise HTTPException(status_code=403, detail="Only the host can archive this match")

    if match.status not in ["open", "full"]:
        raise HTTPException(status_code=400, detail="Closed and completed matches are retained for history")

    match.status = "cancelled"
    session.add(match)
    await session.commit()
    
    return {"success": True, "message": "Match archived successfully"}

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

    if match.status not in ["open", "full"]:
        raise HTTPException(status_code=400, detail="Match is not open for joining")

    # Validate Capacity
    if len(match.players) >= match.maxPlayers:
        if match.status != "full":
            match.status = "full"
            session.add(match)
            await session.commit()
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
    player_count = (await session.execute(select(func.count()).select_from(MatchPlayer).where(MatchPlayer.matchId == match.id))).scalar_one()
    if player_count >= match.maxPlayers:
        match.status = "full"
        session.add(match)
        await session.commit()
    stmt = (
        select(Match)
        .where(Match.id == match.id)
        .options(selectinload(Match.players).selectinload(MatchPlayer.user))
        .execution_options(populate_existing=True)
    )
    fresh = (await session.execute(stmt)).scalars().first()
    if fresh and player_count >= fresh.maxPlayers:
        fresh.status = "full"
        session.add(fresh)
        await session.commit()
        await session.refresh(fresh)
    return {"success": True, "data": _serialize_match(fresh or match)}


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

    if match.status not in ["open", "full"]:
        raise HTTPException(status_code=400, detail="Match is not open for joining")

    if match.password and match.password != payload.password:
        raise HTTPException(status_code=401, detail="Incorrect password")

    if len(match.players) >= match.maxPlayers:
        if match.status != "full":
            match.status = "full"
            session.add(match)
            await session.commit()
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
    player_count = (await session.execute(select(func.count()).select_from(MatchPlayer).where(MatchPlayer.matchId == match.id))).scalar_one()
    if player_count >= match.maxPlayers:
        match.status = "full"
        session.add(match)
        await session.commit()
    stmt = (
        select(Match)
        .where(Match.id == match.id)
        .options(selectinload(Match.players).selectinload(MatchPlayer.user))
        .execution_options(populate_existing=True)
    )
    fresh = (await session.execute(stmt)).scalars().first()
    if fresh and player_count >= fresh.maxPlayers:
        fresh.status = "full"
        session.add(fresh)
        await session.commit()
        await session.refresh(fresh)
    return {"success": True, "matchId": match.id, "data": _serialize_match(fresh or match)}


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

    if match.status in ["closed", "completed"]:
        raise HTTPException(status_code=400, detail="Cannot leave a match after it has been closed")

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
        match.status = "cancelled"
        session.add(match)
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

    if match.status not in ["open", "full"]:
        raise HTTPException(status_code=400, detail="Can only kick players from an active lobby")
        
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
    userId: Optional[str] = None
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

    if match.status not in ["open", "full"]:
        raise HTTPException(status_code=400, detail="Only open or full matches can be closed")

    now = datetime.utcnow()
    match.status = "closed"
    match.completedAt = now
    match.submissionDeadline = now + timedelta(hours=24)
    match.verificationDeadline = now + timedelta(hours=24)
    if payload:
        if payload.teamAScore is not None:
            match.teamAScore = payload.teamAScore
        if payload.teamBScore is not None:
            match.teamBScore = payload.teamBScore

    for player in match.players:
        _append_match_notification(
            match,
            player.userId,
            "submit_stats",
            "Match closed. Submit your stats for peer verification.",
            match.submissionDeadline,
        )

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

    match_result = await session.execute(select(Match).where(Match.id == match_id).options(selectinload(Match.players)))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.status != "closed":
        raise HTTPException(status_code=400, detail="Stats can only be submitted after the match is closed")

    if payload.userId and payload.userId != db_user.id:
        raise HTTPException(status_code=403, detail="Cannot submit stats for another player")

    if match.submissionDeadline and datetime.utcnow() > match.submissionDeadline:
        raise HTTPException(status_code=400, detail="Stat submission window has expired")

    # Verify user was in the match
    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.matchId == match_id, MatchPlayer.userId == db_user.id)
    )
    match_player = player_result.scalars().first()
    if not match_player:
        raise HTTPException(status_code=403, detail="You were not part of this match")

    # Check if stats already submitted
    existing_stats_result = await session.execute(
        select(MatchStats).where(MatchStats.matchId == match_id, MatchStats.userId == db_user.id)
    )
    if existing_stats_result.scalars().first():
        raise HTTPException(status_code=400, detail="Stats already submitted for this match")

    # Team Goals Validation
    max_team_goals = None
    if match_player.team == "A" and match.teamAScore is not None:
        max_team_goals = match.teamAScore
    elif match_player.team == "B" and match.teamBScore is not None:
        max_team_goals = match.teamBScore
    elif (match.teamAScore is not None or match.teamBScore is not None) and payload.goals > 0:
        # If match has scores but player has no team, they cannot claim goals
        raise HTTPException(status_code=400, detail="You must be assigned to a team to claim goals for a match with scores.")

    if max_team_goals is not None:
        # Get all goals already claimed by teammates
        teammate_stats_result = await session.execute(
            select(MatchStats).join(MatchPlayer, MatchStats.userId == MatchPlayer.userId)
            .where(
                MatchStats.matchId == match_id, 
                MatchPlayer.matchId == match_id, 
                MatchPlayer.team == match_player.team
            )
        )
        teammate_stats = teammate_stats_result.scalars().all()
        already_claimed = sum(s.goals for s in teammate_stats)
        
        if payload.goals + already_claimed > max_team_goals:
            raise HTTPException(
                status_code=400, 
                detail=f"Team {match_player.team} scored {max_team_goals} goals. Teammates have already claimed {already_claimed} goals. You can claim a maximum of {max_team_goals - already_claimed} goals."
            )

    # 1. Velocity Cap: Max 3 matches per 24 hours
    twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
    velocity_result = await session.execute(
        select(MatchStats).where(MatchStats.userId == db_user.id, MatchStats.createdAt >= twenty_four_hours_ago)
    )
    velocity_count = len(velocity_result.scalars().all())
    if velocity_count >= 3:
        raise HTTPException(status_code=400, detail="Velocity limit exceeded: You have already submitted stats for 3 matches in the last 24 hours.")

    # 2. Stat Cap Validation
    format_caps = {
        "3v3": 4,
        "5v5": 5,
        "7v7": 5,
        "11v11": 6
    }
    cap = format_caps.get(match.format, 4)
    if payload.goals > cap:
        raise HTTPException(status_code=400, detail=f"Goals are capped at {cap} for {match.format}.")
    if payload.assists > cap:
        raise HTTPException(status_code=400, detail=f"Assists are capped at {cap} for {match.format}.")
    if payload.saves > 50:
        raise HTTPException(status_code=400, detail="Submitted stats exceed realistic limits (max 50 for saves).")
    if payload.tackles > 100 or payload.interceptions > 100 or payload.ballRecoveries > 100:
        raise HTTPException(status_code=400, detail="Submitted stats exceed realistic limits (max 100 for defensive actions).")
    if payload.yellowCards > 2 or payload.redCards > 1:
        raise HTTPException(status_code=400, detail="Invalid discipline stats.")
    if payload.cleanSheet and (db_user.position or "").upper() != "GK":
        raise HTTPException(status_code=400, detail="Clean sheets can only be submitted by goalkeepers.")

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

    goals = payload.goals
    assists = payload.assists
    yellow_cards = payload.yellowCards
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
        motm=False,
        yellowCards=yellow_cards,
        redCards=red_cards,
        ownGoals=payload.ownGoals,
        noShow=payload.noShow,
        status="pending",
        isFlagged=is_flagged,
        flagReason=flag_reason
    )

    session.add(stats)
    for player in match.players:
        if player.userId == db_user.id:
            continue
        _append_match_notification(
            match,
            player.userId,
            "verify_stats",
            f"{db_user.username} submitted stats. Verify or dispute them.",
            match.verificationDeadline,
        )
    session.add(match)
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
        .where(MatchStats.status.in_(["pending", "pending_verification", "flagged_peer_verification"]))
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


def process_verified_stats(session, stat, match, verified_by_count: int = 0):
    from app.core.stats import calculate_stat_gain
    from app.api.leaderboard import invalidate_leaderboard_cache
    from ml.ovr_predictor import predict_ovr

    invalidate_leaderboard_cache()
    db_user = stat.user
    if not db_user:
        return

    is_win = False
    is_draw = False
    player_team = None
    if match.teamAScore is not None and match.teamBScore is not None:
        player_team = next((p.team for p in match.players if p.userId == stat.userId), None)
        is_win = (match.teamAScore > match.teamBScore and player_team == "A") or \
                 (match.teamBScore > match.teamAScore and player_team == "B")
        is_draw = match.teamAScore == match.teamBScore

    xp_award = (stat.goals * 10) + (stat.assists * 7)
    if stat.cleanSheet:
        xp_award += 15

    db_user.xp = (db_user.xp or 0) + xp_award

    db_user.matchesPlayed = (db_user.matchesPlayed or 0) + 1
    if is_win:
        db_user.wins = (db_user.wins or 0) + 1
    elif is_draw:
        db_user.draws = (db_user.draws or 0) + 1
    else:
        db_user.losses = (db_user.losses or 0) + 1
        
    db_user.goals = (db_user.goals or 0) + stat.goals
    db_user.assists = (db_user.assists or 0) + stat.assists
    db_user.tackles = (db_user.tackles or 0) + stat.tackles
    db_user.saves = (db_user.saves or 0) + stat.saves
    db_user.intercepts = (db_user.intercepts or 0) + stat.interceptions
    
    # Find max goals and assists in the match
    all_stats = match.stats
    max_goals = max((s.goals for s in all_stats), default=0)
    max_assists = max((s.assists for s in all_stats), default=0)
    
    progression_award = 3
    reasons = ["Base award (3 pts)"]
    
    if stat.goals > 0 and stat.goals == max_goals:
        progression_award += 2
        reasons.append("Top scorer bonus (2 pts)")
    
    if stat.assists > 0 and stat.assists == max_assists:
        progression_award += 1
        reasons.append("Top assister bonus (1 pt)")
        
    db_user.progressionPoints = (db_user.progressionPoints or 0) + progression_award
    db_user.totalPointsEarned = (db_user.totalPointsEarned or 0) + progression_award
    db_user.verifiedMatchCount = (db_user.verifiedMatchCount or 0) + 1
    
    print(f"Awarded {progression_award} progression points to {db_user.username} for match {match.id}. Reasons: {', '.join(reasons)}")
    
    # Recalculate Overall using the ML position-aware model
    db_user.overall = predict_ovr(
        position    = db_user.position,
        pace        = db_user.pace,
        shooting    = db_user.shooting,
        passing     = db_user.passing,
        dribbling   = db_user.dribbling,
        defending   = db_user.defending,
        physical    = db_user.physical,
        gk_diving   = db_user.gkDiving,
        gk_handling = db_user.gkHandling,
        gk_kicking  = db_user.gkKicking,
        gk_reflexes = db_user.gkReflexes,
        gk_positioning = db_user.gkPositioning,
    )
    db_user.OVR = db_user.overall
    
    old_level = db_user.level or 1
    db_user.level = (db_user.xp // 1000) + 1
    new_frame = _card_frame_for_level(db_user.level)
    if db_user.cardFrame != new_frame:
        db_user.needsUpgradeAnimation = True
    db_user.cardFrame = new_frame
    if db_user.level > old_level and _card_frame_for_level(old_level) != new_frame:
        db_user.needsUpgradeAnimation = True

    _sync_user_card_aliases(db_user)

    _append_user_history(db_user, match, player_team, stat.goals, stat.assists, verified_by_count)

    session.add(db_user)

    log = XPLog(userId=stat.userId, matchId=match.id, amount=xp_award, reason="Match Stats Verified")
    session.add(log)


class VerifyStatsRequest(BaseModel):
    targetPlayerId: str
    vote: Literal[1, -1]  # 1 for approve, -1 for dispute
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

    match_result = await session.execute(
        select(Match).where(Match.id == match_id).options(
            selectinload(Match.players),
            selectinload(Match.stats).selectinload(MatchStats.user)
        )
    )
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    participant_ids = {p.userId for p in match.players}
    if db_user.id not in participant_ids:
        raise HTTPException(status_code=403, detail="Only match participants can verify stats")
    if payload.targetPlayerId not in participant_ids:
        raise HTTPException(status_code=400, detail="Target player is not in this match")

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
    await session.flush()  # So we can count the vote immediately

    # Check if threshold is met and we should verify stats automatically
    if match and len(match.players) > 1:
        N = len(match.players) - 1
        quorum_threshold = math.ceil(0.6 * N)
        
        all_verifications = await session.execute(
            select(MatchVerification).where(MatchVerification.matchId == match_id).where(MatchVerification.targetPlayerId == payload.targetPlayerId)
        )
        votes_for_target = all_verifications.scalars().all()
        
        total_votes = len(votes_for_target)
        approvals = sum(1 for v in votes_for_target if v.vote == 1)
        
        if total_votes >= quorum_threshold and approvals >= quorum_threshold:
            # We hit the threshold! Let's verify them instantly.
            stat_result = await session.execute(
                select(MatchStats)
                .where(MatchStats.matchId == match_id)
                .where(MatchStats.userId == payload.targetPlayerId)
                .options(selectinload(MatchStats.user))
            )
            target_stat = stat_result.scalars().first()
            if target_stat and target_stat.status not in ["verified", "voided"]:
                target_stat.status = "verified"
                process_verified_stats(session, target_stat, match, approvals)

    await session.commit()

    return {"success": True, "message": "Vote recorded"}

@router.post("/{match_id}/quick-complete")
async def quick_complete_match(
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
        select(Match).where(Match.id == match_id).options(selectinload(Match.players).selectinload(MatchPlayer.user))
    )
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only the host can quick-complete the match")

    if match.status not in ["open", "full", "closed"]:
        raise HTTPException(status_code=400, detail="Match cannot be quick-completed from this state")

    # Generate empty stats for all checked-in players
    for player in match.players:
        if player.status != "checked_in":
            continue

        stat_result = await session.execute(
            select(MatchStats).where(MatchStats.matchId == match.id, MatchStats.userId == player.userId)
        )
        existing_stat = stat_result.scalars().first()

        if not existing_stat:
            stats = MatchStats(
                matchId=match.id,
                userId=player.userId,
                status="verified",
                motm=False
            )
            session.add(stats)

            # Base participation XP
            if not hasattr(player.user, "xp"):
                player.user.xp = 0
            player.user.xp += 100
            session.add(player.user)
            
            log = XPLog(userId=player.userId, matchId=match.id, amount=100, reason="Match Participation")
            session.add(log)

    if match.teamAScore is None:
        match.teamAScore = 0
    if match.teamBScore is None:
        match.teamBScore = 0

    match.status = "completed"
    await session.commit()

    return {"success": True, "message": "Match quickly completed"}


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

    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only the host can complete the match")

    if match.status != "closed":
        raise HTTPException(status_code=400, detail="Match is not closed")

    # Total players in match
    total_players = len(match.players)
    if total_players <= 1:
        return {"success": True, "message": "Not enough players to verify"}

    N = total_players - 1  # Total OTHER players
    quorum_threshold = math.ceil(0.6 * N)

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

    stats_by_user = {s.userId: s for s in all_stats}
    missing_stats = [p.userId for p in match.players if p.userId not in stats_by_user]
    unresolved_stats = [s for s in all_stats if s.status not in ["verified", "voided"]]
    if (missing_stats or unresolved_stats) and match.verificationDeadline and datetime.utcnow() < match.verificationDeadline:
        ready_to_finalize = True
        if missing_stats:
            ready_to_finalize = False
        for stat in unresolved_stats:
            votes_for_target = [v for v in all_verifications if v.targetPlayerId == stat.userId]
            approvals = sum(1 for v in votes_for_target if v.vote == 1)
            rejections = sum(1 for v in votes_for_target if v.vote == 0)
            if not (approvals >= quorum_threshold or rejections >= quorum_threshold):
                ready_to_finalize = False
                break
        if not ready_to_finalize:
            raise HTTPException(status_code=400, detail="Verification window is still open")

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
                process_verified_stats(session, stat, match, approvals)
            else:
                stat.status = "voided"
        else:
            # Under 60% responded after 24 hrs
            stat.status = "voided"
            
        results.append({"userId": target_id, "status": stat.status})

    # MOTM Assignment
    from app.core.stats import calculate_match_rating
    best_rating = 0.0
    motm_stat = None
    for stat in all_stats:
        if stat.status == "verified":
            stat_dict = {
                "goals": stat.goals,
                "assists": stat.assists,
                "yellowCards": stat.yellowCards,
                "redCards": stat.redCards,
                "ownGoals": stat.ownGoals,
                "noShow": stat.noShow,
                "cleanSheet": stat.cleanSheet,
                "tackles": stat.tackles,
                "interceptions": stat.interceptions,
                "saves": stat.saves,
                "keyPasses": stat.keyPasses
            }
            rating = calculate_match_rating(stat.user.position, stat_dict)
            if rating > best_rating:
                best_rating = rating
                motm_stat = stat

    if motm_stat:
        motm_stat.motm = True

    for player in match.players:
        if not player.user:
            continue
        player_stat = stats_by_user.get(player.userId)
        verified_by_count = 0
        goals = 0
        assists = 0
        if player_stat:
            votes_for_target = [v for v in all_verifications if v.targetPlayerId == player.userId]
            verified_by_count = sum(1 for v in votes_for_target if v.vote == 1)
            goals = player_stat.goals if player_stat.status == "verified" else 0
            assists = player_stat.assists if player_stat.status == "verified" else 0
        _append_user_history(player.user, match, player.team, goals, assists, verified_by_count)
        _sync_user_card_aliases(player.user)
        session.add(player.user)

    match.status = "completed"
    await session.commit()
    return {"success": True, "message": "Match completed successfully and stats recorded.", "results": results}
