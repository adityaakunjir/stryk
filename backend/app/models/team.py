"""
STRYK Backend - Team Model

SQLModel schema for teams and team members.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import ConfigDict
from sqlmodel import SQLModel, Field, Relationship


class TeamBase(SQLModel):
    name: str = Field(max_length=100)
    logoUrl: Optional[str] = Field(default=None, max_length=500)
    captainId: str = Field(index=True, foreign_key="users.id")
    wins: int = Field(default=0, ge=0)
    losses: int = Field(default=0, ge=0)
    draws: int = Field(default=0, ge=0)


class Team(TeamBase, table=True):
    __tablename__ = "teams"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    captain: "User" = Relationship(back_populates="captained_teams")
    members: List["TeamMember"] = Relationship(back_populates="team")
    invites: List["TeamInvite"] = Relationship(back_populates="team")


class TeamMemberBase(SQLModel):
    teamId: str = Field(index=True, foreign_key="teams.id")
    userId: str = Field(index=True, foreign_key="users.id")
    role: str = Field(default="player", max_length=50)


class TeamMember(TeamMemberBase, table=True):
    __tablename__ = "team_members"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    team: Team = Relationship(back_populates="members")
    user: "User" = Relationship(back_populates="team_members")


class TeamInviteBase(SQLModel):
    teamId: str = Field(index=True, foreign_key="teams.id")
    senderId: str = Field(index=True, foreign_key="users.id")
    receiverId: str = Field(index=True, foreign_key="users.id")
    status: str = Field(default="pending", max_length=20)


class TeamInvite(TeamInviteBase, table=True):
    __tablename__ = "team_invites"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    team: Team = Relationship(back_populates="invites")
    
    sender: "User" = Relationship(
        back_populates="sent_team_invites",
        sa_relationship_kwargs={"foreign_keys": "TeamInvite.senderId"}
    )
    receiver: "User" = Relationship(
        back_populates="received_team_invites",
        sa_relationship_kwargs={"foreign_keys": "TeamInvite.receiverId"}
    )
