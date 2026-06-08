"""
STRYK Backend - Match Model

SQLModel schema for matches and participants.
"""

import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import ConfigDict
from sqlmodel import SQLModel, Field, Relationship


class MatchBase(SQLModel):
    title: str = Field(max_length=100)
    location: str = Field(max_length=200)
    dateTime: datetime
    maxPlayers: int = Field(default=22)
    status: str = Field(default="open", max_length=20)
    creatorId: str = Field(index=True, foreign_key="users.id")


class Match(MatchBase, table=True):
    __tablename__ = "matches"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    creator: "User" = Relationship(back_populates="created_matches")
    participants: List["MatchParticipant"] = Relationship(back_populates="match")


class MatchParticipantBase(SQLModel):
    matchId: str = Field(index=True, foreign_key="matches.id")
    userId: str = Field(index=True, foreign_key="users.id")
    team: Optional[str] = Field(default=None, max_length=50)
    checkedIn: bool = Field(default=False)


class MatchParticipant(MatchParticipantBase, table=True):
    __tablename__ = "match_participants"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    match: Match = Relationship(back_populates="participants")
    user: "User" = Relationship(back_populates="match_participants")
