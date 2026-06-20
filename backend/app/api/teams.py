"""
STRYK Backend - Teams API

Endpoints for creating teams, inviting members, etc.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
# from app.api.auth import get_current_user
from app.models.team import Team, TeamMember, TeamInvite
from app.models.player import User

router = APIRouter(prefix="/teams", tags=["teams"])

# Placeholder until auth is implemented
async def get_current_user_placeholder(session: AsyncSession = Depends(get_session)) -> User:
    result = await session.execute(select(User).limit(1))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


@router.post("/", response_model=Team, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_name: str,
    logoUrl: Optional[str] = None,
    current_user: User = Depends(get_current_user_placeholder),
    session: AsyncSession = Depends(get_session),
):
    team = Team(name=team_name, logoUrl=logoUrl, captainId=current_user.id)
    session.add(team)
    await session.commit()
    await session.refresh(team)

    # Add creator as team member
    member = TeamMember(teamId=team.id, userId=current_user.id, role="captain")
    session.add(member)
    await session.commit()

    return team


@router.get("/me", response_model=List[Team])
async def get_my_teams(
    current_user: User = Depends(get_current_user_placeholder),
    session: AsyncSession = Depends(get_session),
):
    # Get all teams where current_user is a member
    statement = select(TeamMember).where(TeamMember.userId == current_user.id)
    members = await session.exec(statement)
    members = members.all()

    teams = []
    for m in members:
        team_stmt = select(Team).where(Team.id == m.teamId)
        team = await session.exec(team_stmt)
        team = team.first()
        if team:
            teams.append(team)
    
    return teams
