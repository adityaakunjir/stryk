"""
STRYK Backend - Match Model

SQLModel schema for matches and related tables (players, stats, verification, etc).
"""

import uuid
import random
import string
from datetime import datetime
from typing import Optional, List
from pydantic import ConfigDict
from sqlmodel import SQLModel, Field, Relationship


def generate_short_id() -> str:
    """Generate a 6-character uppercase alphanumeric string."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(6))


# --- Core Match ---

class MatchBase(SQLModel):
    title: str = Field(max_length=100)
    turf: Optional[str] = Field(default=None, max_length=100)
    location: str = Field(max_length=200)
    format: str = Field(default="11v11", max_length=20)
    matchDate: datetime
    maxPlayers: int = Field(default=22)
    password: Optional[str] = Field(default=None, max_length=50)
    status: str = Field(default="open", max_length=20)
    discordLink: Optional[str] = Field(default=None, max_length=200)
    hostId: str = Field(index=True, foreign_key="users.id")
    shortId: str = Field(default_factory=generate_short_id, index=True, unique=True, max_length=10)
    teamAScore: Optional[int] = Field(default=None)
    teamBScore: Optional[int] = Field(default=None)


class Match(MatchBase, table=True):
    __tablename__ = "matches"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    host: "User" = Relationship(back_populates="hosted_matches")
    players: List["MatchPlayer"] = Relationship(back_populates="match")
    teams: List["MatchTeam"] = Relationship(back_populates="match")
    invites: List["MatchInvite"] = Relationship(back_populates="match")
    stats: List["MatchStats"] = Relationship(back_populates="match")
    verifications: List["MatchVerification"] = Relationship(back_populates="match")


# --- Match Player (Participant) ---

class MatchPlayerBase(SQLModel):
    matchId: str = Field(index=True, foreign_key="matches.id")
    userId: str = Field(index=True, foreign_key="users.id")
    team: Optional[str] = Field(default=None, max_length=50)
    status: str = Field(default="joined", max_length=20)


class MatchPlayer(MatchPlayerBase, table=True):
    __tablename__ = "match_players"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    joinedAt: datetime = Field(default_factory=datetime.utcnow)

    match: Match = Relationship(back_populates="players")
    user: "User" = Relationship(back_populates="match_players")


# --- Match Team ---

class MatchTeamBase(SQLModel):
    matchId: str = Field(index=True, foreign_key="matches.id")
    name: str = Field(max_length=50)
    score: int = Field(default=0)
    color: Optional[str] = Field(default=None, max_length=20)


class MatchTeam(MatchTeamBase, table=True):
    __tablename__ = "match_teams"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    
    match: Match = Relationship(back_populates="teams")


# --- Match Invite ---

class MatchInviteBase(SQLModel):
    matchId: str = Field(index=True, foreign_key="matches.id")
    senderId: str = Field(index=True, foreign_key="users.id")
    receiverId: str = Field(index=True, foreign_key="users.id")
    status: str = Field(default="pending", max_length=20)


class MatchInvite(MatchInviteBase, table=True):
    __tablename__ = "match_invites"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    match: Match = Relationship(back_populates="invites")
    sender: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "MatchInvite.senderId"},
        back_populates="sent_match_invites"
    )
    receiver: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "MatchInvite.receiverId"},
        back_populates="received_match_invites"
    )


# --- Match Stats ---

class MatchStatsBase(SQLModel):
    matchId: str = Field(index=True, foreign_key="matches.id")
    userId: str = Field(index=True, foreign_key="users.id")
    goals: int = Field(default=0)
    assists: int = Field(default=0)
    shotsOnTarget: int = Field(default=0)
    keyPasses: int = Field(default=0)
    interceptions: int = Field(default=0)
    ballRecoveries: int = Field(default=0)
    progressivePasses: int = Field(default=0)
    tackles: int = Field(default=0)
    blocks: int = Field(default=0)
    clearances: int = Field(default=0)
    saves: int = Field(default=0)
    bigSaves: int = Field(default=0)
    penaltySaves: int = Field(default=0)
    distributionAssists: int = Field(default=0)
    duelsWon: int = Field(default=0)
    aerialDuelsWon: int = Field(default=0)
    cleanSheet: bool = Field(default=False)
    motm: bool = Field(default=False)
    yellowCards: int = Field(default=0)
    redCards: int = Field(default=0)
    ownGoals: int = Field(default=0)
    noShow: bool = Field(default=False)
    status: str = Field(default="pending_verification", max_length=30)
    verificationNote: Optional[str] = Field(default=None, max_length=255)


class MatchStats(MatchStatsBase, table=True):
    __tablename__ = "match_stats"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)

    match: Match = Relationship(back_populates="stats")
    user: "User" = Relationship(back_populates="match_stats")


# --- Match Verification ---

class MatchVerificationBase(SQLModel):
    matchId: str = Field(index=True, foreign_key="matches.id")
    targetPlayerId: str = Field(index=True, foreign_key="users.id")
    verifierId: str = Field(index=True, foreign_key="users.id")
    vote: int = Field(default=1) # 1 for valid, -1 for invalid
    disputeReason: Optional[str] = Field(default=None, max_length=100)


class MatchVerification(MatchVerificationBase, table=True):
    __tablename__ = "match_verifications"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    match: Match = Relationship(back_populates="verifications")


# --- XP Log ---

class XPLogBase(SQLModel):
    userId: str = Field(index=True, foreign_key="users.id")
    matchId: Optional[str] = Field(default=None, foreign_key="matches.id")
    amount: int = Field(default=0)
    reason: str = Field(max_length=100)


class XPLog(XPLogBase, table=True):
    __tablename__ = "xp_logs"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
