"""
STRYK Backend - Player Model

SQLModel schema for the players table in Supabase PostgreSQL.
"""

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class PlayerBase(SQLModel):
    """Shared player fields used for creation and reading."""

    clerk_user_id: str = Field(index=True, unique=True)
    full_name: str = Field(max_length=100)
    username: str = Field(max_length=40, index=True, unique=True)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    position: str = Field(max_length=10, default="CAM")
    secondary_position: Optional[str] = Field(default=None, max_length=10)
    strong_foot: str = Field(max_length=10, default="Right")
    play_style: str = Field(max_length=20, default="Playmaker")
    bio: Optional[str] = Field(default=None, max_length=120)
    rating: int = Field(default=80, ge=1, le=99)


class Player(PlayerBase, table=True):
    """Database table model for players."""

    __tablename__ = "players"

    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PlayerCreate(PlayerBase):
    """Schema for creating a new player."""

    pass


class PlayerRead(PlayerBase):
    """Schema for reading a player (includes id and timestamps)."""

    id: int
    created_at: datetime
    updated_at: datetime


class PlayerUpdate(SQLModel):
    """Schema for updating a player (all fields optional)."""

    full_name: Optional[str] = None
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    position: Optional[str] = None
    secondary_position: Optional[str] = None
    strong_foot: Optional[str] = None
    play_style: Optional[str] = None
    bio: Optional[str] = None
    rating: Optional[int] = None
