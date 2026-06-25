"""Authenticated team management endpoints."""

from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User
from app.models.team import Team, TeamInvite, TeamMember

router = APIRouter(prefix="/team", tags=["teams"])


class TeamCreateInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    logoUrl: str | None = None


class TeamInviteInput(BaseModel):
    teamId: str
    username: str = Field(min_length=1, max_length=40)


class InviteActionInput(BaseModel):
    inviteId: str


class TeamUpdateInput(BaseModel):
    teamId: str
    name: str | None = Field(default=None, min_length=2, max_length=100)
    logoUrl: str | None = None
    action: Literal["kick", "transfer-captaincy"] | None = None
    memberId: str | None = None
    newCaptainMemberId: str | None = None


async def _database_user(
    auth_user: dict = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> User:
    result = await session.execute(select(User).where(User.clerkId == auth_user["sub"]))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Complete your player profile first")
    return user


async def _load_team(session: AsyncSession, team_id: str) -> Team | None:
    result = await session.execute(
        select(Team).where(Team.id == team_id).options(
            selectinload(Team.members).selectinload(TeamMember.user)
        )
    )
    return result.scalars().first()


async def _membership(session: AsyncSession, user_id: str) -> TeamMember | None:
    result = await session.execute(select(TeamMember).where(TeamMember.userId == user_id))
    return result.scalars().first()


def _serialize_team(team: Team) -> dict:
    return {
        "id": team.id, "name": team.name, "logoUrl": team.logoUrl,
        "captainId": team.captainId, "wins": team.wins,
        "losses": team.losses, "draws": team.draws,
        "createdAt": team.createdAt.isoformat(),
        "members": [{
            "id": member.id, "userId": member.userId, "role": member.role,
            "createdAt": member.createdAt.isoformat(),
            "user": {
                "id": member.user.id, "username": member.user.username,
                "fullName": member.user.fullName, "avatarUrl": member.user.avatarUrl,
                "position": member.user.position, "overall": member.user.overall,
            },
        } for member in team.members],
    }


@router.get("/me")
async def get_my_team(current_user: User = Depends(_database_user), session: AsyncSession = Depends(get_session)):
    member = await _membership(session, current_user.id)
    if not member:
        return {"success": True, "team": None, "userRole": None}
    team = await _load_team(session, member.teamId)
    return {"success": True, "team": _serialize_team(team) if team else None, "userRole": member.role}


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_team(body: TeamCreateInput, current_user: User = Depends(_database_user), session: AsyncSession = Depends(get_session)):
    if await _membership(session, current_user.id):
        raise HTTPException(status_code=409, detail="You already belong to a team")
    team = Team(name=body.name.strip(), logoUrl=body.logoUrl, captainId=current_user.id)
    session.add(team)
    await session.flush()
    session.add(TeamMember(teamId=team.id, userId=current_user.id, role="captain"))
    await session.commit()
    return {"success": True, "team": _serialize_team(await _load_team(session, team.id))}


@router.patch("/me")
async def update_team(body: TeamUpdateInput, current_user: User = Depends(_database_user), session: AsyncSession = Depends(get_session)):
    team = await _load_team(session, body.teamId)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.captainId != current_user.id:
        raise HTTPException(status_code=403, detail="Only the captain can manage this team")
    if body.action == "kick":
        member = next((item for item in team.members if item.id == body.memberId), None)
        if not member:
            raise HTTPException(status_code=404, detail="Team member not found")
        if member.userId == current_user.id:
            raise HTTPException(status_code=400, detail="Transfer captaincy before leaving")
        await session.delete(member)
    elif body.action == "transfer-captaincy":
        member = next((item for item in team.members if item.id == body.newCaptainMemberId), None)
        captain = next((item for item in team.members if item.userId == current_user.id), None)
        if not member or not captain:
            raise HTTPException(status_code=404, detail="Team member not found")
        member.role, captain.role, team.captainId = "captain", "player", member.userId
        session.add(member)
        session.add(captain)
        session.add(team)
    else:
        if body.name is not None:
            team.name = body.name.strip()
        team.logoUrl = body.logoUrl
        session.add(team)
    await session.commit()
    return {"success": True, "team": _serialize_team(await _load_team(session, team.id))}


@router.delete("/me")
async def delete_team(teamId: str, current_user: User = Depends(_database_user), session: AsyncSession = Depends(get_session)):
    team = await _load_team(session, teamId)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.captainId != current_user.id:
        raise HTTPException(status_code=403, detail="Only the captain can disband this team")
    invites = await session.execute(select(TeamInvite).where(TeamInvite.teamId == team.id))
    for invite in invites.scalars().all():
        await session.delete(invite)
    for member in team.members:
        await session.delete(member)
    await session.delete(team)
    await session.commit()
    return {"success": True}


@router.get("/invite")
async def list_invites(current_user: User = Depends(_database_user), session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(TeamInvite).where(
            TeamInvite.receiverId == current_user.id, TeamInvite.status == "pending"
        ).options(selectinload(TeamInvite.team))
    )
    return {"success": True, "invites": [{
        "id": invite.id, "teamId": invite.teamId, "teamName": invite.team.name,
        "teamLogo": invite.team.logoUrl, "status": invite.status,
        "createdAt": invite.createdAt.isoformat(),
    } for invite in result.scalars().all()]}


@router.post("/invite", status_code=status.HTTP_201_CREATED)
async def invite_player(body: TeamInviteInput, current_user: User = Depends(_database_user), session: AsyncSession = Depends(get_session)):
    team = await _load_team(session, body.teamId)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.captainId != current_user.id:
        raise HTTPException(status_code=403, detail="Only the captain can invite players")
    target_result = await session.execute(select(User).where(User.username.ilike(body.username.strip())))
    target = target_result.scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="Player not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="You are already the team captain")
    if await _membership(session, target.id):
        raise HTTPException(status_code=409, detail="Player already belongs to a team")
    existing = await session.execute(select(TeamInvite).where(
        TeamInvite.teamId == team.id, TeamInvite.receiverId == target.id,
        TeamInvite.status == "pending",
    ))
    if existing.scalars().first():
        raise HTTPException(status_code=409, detail="Invitation already pending")
    invite = TeamInvite(teamId=team.id, senderId=current_user.id, receiverId=target.id)
    session.add(invite)
    await session.commit()
    return {"success": True, "inviteId": invite.id}


@router.delete("/invite")
async def decline_invite(body: InviteActionInput, current_user: User = Depends(_database_user), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(TeamInvite).where(TeamInvite.id == body.inviteId))
    invite = result.scalars().first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invite.receiverId != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to decline this invitation")
    invite.status = "declined"
    session.add(invite)
    await session.commit()
    return {"success": True}


@router.post("/accept")
async def accept_invite(body: InviteActionInput, current_user: User = Depends(_database_user), session: AsyncSession = Depends(get_session)):
    if await _membership(session, current_user.id):
        raise HTTPException(status_code=409, detail="Leave your current team before accepting")
    result = await session.execute(select(TeamInvite).where(TeamInvite.id == body.inviteId))
    invite = result.scalars().first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invite.receiverId != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this invitation")
    if invite.status != "pending":
        raise HTTPException(status_code=409, detail="Invitation is no longer pending")
    invite.status = "accepted"
    session.add(invite)
    session.add(TeamMember(teamId=invite.teamId, userId=current_user.id, role="player"))
    await session.commit()
    return {"success": True, "teamId": invite.teamId}
