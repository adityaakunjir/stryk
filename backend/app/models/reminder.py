"""Opt-in reminder preferences, inbox events and per-device push delivery."""
import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint

class ReminderPreference(SQLModel, table=True):
    __tablename__ = "reminder_preferences"
    userId: str = Field(primary_key=True, foreign_key="users.id")
    enabled: bool = False

class PushDevice(SQLModel, table=True):
    __tablename__ = "push_devices"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    userId: str = Field(foreign_key="users.id", index=True)
    endpoint: str = Field(unique=True, max_length=2048)
    p256dh: str = Field(max_length=200)
    auth: str = Field(max_length=100)
    active: bool = True

class MatchReminder(SQLModel, table=True):
    __tablename__ = "match_reminders"
    __table_args__ = (UniqueConstraint("userId", "dedupeKey"),)
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    userId: str = Field(foreign_key="users.id", index=True)
    matchId: str = Field(foreign_key="matches.id", index=True)
    dedupeKey: str = Field(max_length=200)
    kind: str = Field(max_length=40)
    message: str = Field(max_length=300)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    expiresAt: datetime
    read: bool = False

class ReminderSnapshot(SQLModel, table=True):
    __tablename__ = "reminder_snapshots"
    __table_args__ = (UniqueConstraint("userId", "matchId"),)
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    userId: str = Field(foreign_key="users.id", index=True)
    matchId: str = Field(foreign_key="matches.id")
    fingerprint: str = Field(max_length=64)
    version: int = 0

class PushDelivery(SQLModel, table=True):
    __tablename__ = "push_deliveries"
    __table_args__ = (UniqueConstraint("reminderId", "deviceId"),)
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    reminderId: str = Field(foreign_key="match_reminders.id", index=True)
    deviceId: str = Field(foreign_key="push_devices.id")
    attempts: int = 0
    deliveredAt: Optional[datetime] = None
