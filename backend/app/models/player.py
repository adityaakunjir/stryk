"""
STRYK Backend - Player Model

SQLModel schema for player profiles.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import ConfigDict
from sqlmodel import SQLModel, Field, Relationship


class UserBase(SQLModel):
    """Shared user fields used for creation and reading."""
    model_config = ConfigDict(populate_by_name=True)

    clerkId: str = Field(index=True, unique=True)
    username: str = Field(max_length=40, index=True, unique=True)
    fullName: Optional[str] = Field(default=None, max_length=100)
    avatarUrl: Optional[str] = Field(default=None)
    position: Optional[str] = Field(max_length=10, default=None)
    playStyle: Optional[str] = Field(max_length=20, default=None)
    strongFoot: Optional[str] = Field(max_length=10, default=None)
    bio: Optional[str] = Field(default=None, max_length=120)
    
    xp: int = Field(default=0, ge=0)
    level: int = Field(default=1, ge=1)
    needsUpgradeAnimation: bool = Field(default=False)

    overall: int = Field(default=60, ge=1, le=99)
    pace: float = Field(default=60.0)
    shooting: float = Field(default=60.0)
    passing: float = Field(default=60.0)
    dribbling: float = Field(default=60.0)
    defending: float = Field(default=60.0)
    physical: float = Field(default=60.0)
    gkDiving: float = Field(default=60.0)
    gkHandling: float = Field(default=60.0)
    gkKicking: float = Field(default=60.0)
    gkReflexes: float = Field(default=60.0)
    gkPositioning: float = Field(default=60.0)

    matchesPlayed: int = Field(default=0, ge=0)
    wins: int = Field(default=0, ge=0)
    losses: int = Field(default=0, ge=0)
    draws: int = Field(default=0, ge=0)
    goals: int = Field(default=0, ge=0)
    assists: int = Field(default=0, ge=0)
    tackles: int = Field(default=0, ge=0)
    saves: int = Field(default=0, ge=0)
    intercepts: int = Field(default=0, ge=0)


class User(UserBase, table=True):
    """Database table model for users."""
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationships (defined as strings to avoid circular imports initially)
    team_members: List["TeamMember"] = Relationship(back_populates="user")
    match_players: List["MatchPlayer"] = Relationship(back_populates="user")
    match_stats: List["MatchStats"] = Relationship(back_populates="user")
    
    # Captain of teams
    captained_teams: List["Team"] = Relationship(back_populates="captain")
    # Host of matches
    hosted_matches: List["Match"] = Relationship(back_populates="host")

    # Match Invites
    sent_match_invites: List["MatchInvite"] = Relationship(
        back_populates="sender",
        sa_relationship_kwargs={"foreign_keys": "MatchInvite.senderId"}
    )
    received_match_invites: List["MatchInvite"] = Relationship(
        back_populates="receiver",
        sa_relationship_kwargs={"foreign_keys": "MatchInvite.receiverId"}
    )

    # Friend requests
    sent_friend_requests: List["FriendRequest"] = Relationship(
        back_populates="sender",
        sa_relationship_kwargs={"foreign_keys": "FriendRequest.senderId"}
    )
    received_friend_requests: List["FriendRequest"] = Relationship(
        back_populates="receiver",
        sa_relationship_kwargs={"foreign_keys": "FriendRequest.receiverId"}
    )
    
    # Team invites
    sent_team_invites: List["TeamInvite"] = Relationship(
        back_populates="sender",
        sa_relationship_kwargs={"foreign_keys": "TeamInvite.senderId"}
    )
    received_team_invites: List["TeamInvite"] = Relationship(
        back_populates="receiver",
        sa_relationship_kwargs={"foreign_keys": "TeamInvite.receiverId"}
    )


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: str
    createdAt: datetime
    updatedAt: datetime


class UserUpdate(SQLModel):
    fullName: Optional[str] = None
    username: Optional[str] = None
    avatarUrl: Optional[str] = None
    position: Optional[str] = None
    playStyle: Optional[str] = None
    strongFoot: Optional[str] = None
    bio: Optional[str] = None
    overall: Optional[int] = None
    matchesPlayed: Optional[int] = None
    wins: Optional[int] = None
    losses: Optional[int] = None
    draws: Optional[int] = None
    goals: Optional[int] = None
    assists: Optional[int] = None
    tackles: Optional[int] = None
    saves: Optional[int] = None
    intercepts: Optional[int] = None
