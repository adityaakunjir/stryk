"""Weekly schedules and their independently joinable match occurrences."""
import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import UniqueConstraint


class RecurringGame(SQLModel, table=True):
    __tablename__ = "recurring_games"
    __table_args__ = (UniqueConstraint("hostId", "requestKey"),)
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    hostId: str = Field(foreign_key="users.id", index=True)
    requestKey: str = Field(max_length=80)
    title: str = Field(max_length=100)
    location: str = Field(max_length=200)
    turf: str = Field(default="", max_length=100)
    format: str = Field(default="5v5", max_length=20)
    maxPlayers: int = Field(default=10)
    timezone: str = Field(max_length=80)
    firstLocal: datetime
    weeks: int
    active: bool = Field(default=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class RecurringOccurrence(SQLModel, table=True):
    __tablename__ = "recurring_occurrences"
    __table_args__ = (UniqueConstraint("seriesId", "weekIndex"),)
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    seriesId: str = Field(foreign_key="recurring_games.id", index=True)
    matchId: str = Field(foreign_key="matches.id", unique=True, index=True)
    weekIndex: int
    match: Optional["Match"] = Relationship(back_populates="recurring")
