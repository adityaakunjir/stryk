"""One FIFO standby place per player and match."""
import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint

class MatchWaitlist(SQLModel, table=True):
    __tablename__ = "match_waitlist"
    __table_args__ = (UniqueConstraint("matchId", "userId"),)
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    matchId: str = Field(foreign_key="matches.id", index=True)
    userId: str = Field(foreign_key="users.id", index=True)
    joinedAt: datetime = Field(default_factory=datetime.utcnow, index=True)
