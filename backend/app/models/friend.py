"""
STRYK Backend - Friend Model

SQLModel schema for friend requests.
"""

import uuid
from datetime import datetime
from pydantic import ConfigDict
from sqlmodel import SQLModel, Field, Relationship


class FriendRequestBase(SQLModel):
    senderId: str = Field(index=True)
    receiverId: str = Field(index=True)
    status: str = Field(default="pending", max_length=20)


class FriendRequest(FriendRequestBase, table=True):
    __tablename__ = "friend_requests"
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    sender: "User" = Relationship(
        back_populates="sent_friend_requests",
        sa_relationship_kwargs={"foreign_keys": "FriendRequest.senderId"}
    )
    receiver: "User" = Relationship(
        back_populates="received_friend_requests",
        sa_relationship_kwargs={"foreign_keys": "FriendRequest.receiverId"}
    )
