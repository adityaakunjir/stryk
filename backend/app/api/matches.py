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
from app.models.match import Match, MatchPlayer, MatchInvite, MatchStats
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
        "privacy": "private" if match.password else "public",
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
    stmt = select(Match).where(Match.id == payload.matchId).options(selectinload(Match.players))
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

    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.matchId == payload.matchId, MatchPlayer.userId == db_user.id)
    )
    player = player_result.scalars().first()
    if not player:
        raise HTTPException(status_code=400, detail="You are not in this match")

    await session.delete(player)
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
    
    match_result = await session.execute(select(Match).where(Match.id == match_id))
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
    
    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.matchId == payload.matchId, MatchPlayer.userId == db_user.id)
    )
    player = player_result.scalars().first()
    if not player:
        raise HTTPException(status_code=400, detail="You are not in this match")
        
    player.checkedIn = True
    await session.commit()
    
    match_result = await session.execute(select(Match).where(Match.id == payload.matchId).options(selectinload(Match.players)))
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
    
    match_result = await session.execute(select(Match).where(Match.id == payload.matchId))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only host can assign teams")

    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.id == payload.participantId)
    )
    player = player_result.scalars().first()
    if not player:
        raise HTTPException(status_code=404, detail="Participant not found")
        
    player.team = payload.team
    await session.commit()
    
    match_result = await session.execute(select(Match).where(Match.id == payload.matchId).options(selectinload(Match.players)))
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
    
    match_result = await session.execute(select(Match).where(Match.id == payload.matchId).options(selectinload(Match.players).selectinload(MatchPlayer.user)))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only host can balance teams")

    players = match.players
    # Sort by overall descending
    players_sorted = sorted(players, key=lambda p: p.user.overall if p.user and p.user.overall else 50, reverse=True)
    
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
    
    avg_a = sum(p.user.overall or 50 for p in team_a) / len(team_a) if team_a else 0
    avg_b = sum(p.user.overall or 50 for p in team_b) / len(team_b) if team_b else 0
    
    return {
        "success": True, 
        "data": {
            "avgA": round(avg_a, 1),
            "avgB": round(avg_b, 1),
            "ratingDiff": round(abs(avg_a - avg_b), 1),
            "match": _serialize_match(match)
        }
        }


class SaveTeamsRequest(BaseModel):
    teamA: List[str]  # List of user IDs
    teamB: List[str]  # List of user IDs

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
    
    match_result = await session.execute(select(Match).where(Match.id == match_id).options(selectinload(Match.players)))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only host can save teams")

    players = match.players
    
    # Update teams based on the payload
    for p in players:
        if p.userId in payload.teamA:
            p.team = "A"
        elif p.userId in payload.teamB:
            p.team = "B"
        else:
            p.team = None
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
    
    match_result = await session.execute(select(Match).where(Match.id == match_id))
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
    
    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.matchId == payload.matchId, MatchPlayer.userId == db_user.id)
    )
    player = player_result.scalars().first()
    if not player:
        raise HTTPException(status_code=400, detail="You are not in this match")
        
    player.checkedIn = True
    await session.commit()
    
    match_result = await session.execute(select(Match).where(Match.id == payload.matchId).options(selectinload(Match.players)))
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
    
    match_result = await session.execute(select(Match).where(Match.id == payload.matchId))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only host can assign teams")

    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.id == payload.participantId)
    )
    player = player_result.scalars().first()
    if not player:
        raise HTTPException(status_code=404, detail="Participant not found")
        
    player.team = payload.team
    await session.commit()
    
    match_result = await session.execute(select(Match).where(Match.id == payload.matchId).options(selectinload(Match.players)))
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
    
    match_result = await session.execute(select(Match).where(Match.id == payload.matchId).options(selectinload(Match.players).selectinload(MatchPlayer.user)))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only host can balance teams")

    players = match.players
    # Sort by overall descending
    players_sorted = sorted(players, key=lambda p: p.user.overall if p.user and p.user.overall else 50, reverse=True)
    
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
    
    avg_a = sum(p.user.overall or 50 for p in team_a) / len(team_a) if team_a else 0
    avg_b = sum(p.user.overall or 50 for p in team_b) / len(team_b) if team_b else 0
    
    return {
        "success": True, 
        "data": {
            "avgA": round(avg_a, 1),
            "avgB": round(avg_b, 1),
            "ratingDiff": round(abs(avg_a - avg_b), 1),
            "match": _serialize_match(match)
        }
    }


class SaveTeamsRequest(BaseModel):
    teamA: List[str]  # List of user IDs
    teamB: List[str]  # List of user IDs

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
    
    match_result = await session.execute(select(Match).where(Match.id == match_id).options(selectinload(Match.players)))
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    if match.hostId != db_user.id:
        raise HTTPException(status_code=403, detail="Only host can save teams")

    players = match.players
    
    # Update teams based on the payload
    for p in players:
        if p.userId in payload.teamA:
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

class SubmitStatsRequest(BaseModel):
    goals: int = 0
    assists: int = 0
    saves: int = 0
    tackles: int = 0
    cleanSheet: bool = False
    motm: bool = False
    yellowCards: int = 0
    redCards: int = 0

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

    match_result = await session.execute(select(Match).where(Match.id == match_id))
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

    # Format goals caps
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
    
    # GK only can have a clean sheet
    clean_sheet = payload.cleanSheet if db_user.position == "GK" else False

    stats = MatchStats(
        matchId=match_id,
        userId=db_user.id,
        goals=goals,
        assists=assists,
        saves=payload.saves,
        tackles=payload.tackles,
        cleanSheet=clean_sheet,
        motm=payload.motm,
        yellowCards=yellow_cards,
        redCards=red_cards,
        status="pending_verification"
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
