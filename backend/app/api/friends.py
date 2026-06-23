from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, or_, and_
from typing import List, Dict, Any

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User, UserRead
from app.models.friend import FriendRequest
from pydantic import BaseModel

router = APIRouter(tags=["friends"])

class FriendRequestInput(BaseModel):
    targetUserId: str

class FriendRespondInput(BaseModel):
    requestId: str
    action: str

@router.get("/friends")
async def get_friends(
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Get the authenticated user's friends."""
    clerkId = user.get("sub")
    db_user_res = await session.execute(select(User).where(User.clerkId == clerkId))
    db_user = db_user_res.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Friends are those where there is an accepted friend request
    # between db_user and another user.
    stmt = select(FriendRequest).where(
        and_(
            or_(FriendRequest.senderId == db_user.id, FriendRequest.receiverId == db_user.id),
            FriendRequest.status == "accepted"
        )
    )
    res = await session.execute(stmt)
    friend_requests = res.scalars().all()
    
    friends_list = []
    for fr in friend_requests:
        friend_id = fr.receiverId if fr.senderId == db_user.id else fr.senderId
        friend_user_res = await session.execute(select(User).where(User.id == friend_id))
        friend_user = friend_user_res.scalars().first()
        if friend_user:
            friends_list.append({
                "id": fr.id,
                "user": friend_user,
                "status": "accepted"
            })
            
    # Incoming friend requests
    stmt_incoming = select(FriendRequest).where(
        and_(
            FriendRequest.receiverId == db_user.id,
            FriendRequest.status == "pending"
        )
    )
    res_incoming = await session.execute(stmt_incoming)
    incoming_requests_db = res_incoming.scalars().all()
    
    incoming_list = []
    for req in incoming_requests_db:
        sender_res = await session.execute(select(User).where(User.id == req.senderId))
        sender_user = sender_res.scalars().first()
        if sender_user:
            incoming_list.append({
                "id": req.id,
                "user": sender_user,
                "status": "pending"
            })
            
    return {
        "success": True, 
        "friends": friends_list,
        "incomingRequests": incoming_list
    }

@router.post("/friends/request")
async def send_friend_request(
    data: FriendRequestInput,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    clerkId = user.get("sub")
    db_user_res = await session.execute(select(User).where(User.clerkId == clerkId))
    db_user = db_user_res.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if db_user.id == data.targetUserId:
        raise HTTPException(status_code=400, detail="Cannot send friend request to yourself")
        
    target_user_res = await session.execute(select(User).where(User.id == data.targetUserId))
    target_user = target_user_res.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    # Check if request already exists
    stmt = select(FriendRequest).where(
        or_(
            and_(FriendRequest.senderId == db_user.id, FriendRequest.receiverId == target_user.id),
            and_(FriendRequest.senderId == target_user.id, FriendRequest.receiverId == db_user.id)
        )
    )
    res = await session.execute(stmt)
    existing = res.scalars().first()
    
    if existing:
        return {"success": False, "message": f"Friend request already exists with status: {existing.status}"}
        
    new_request = FriendRequest(
        senderId=db_user.id,
        receiverId=target_user.id,
        status="pending"
    )
    session.add(new_request)
    await session.commit()
    
    return {
        "success": True, 
        "message": "Friend request sent",
        "targetUserClerkId": target_user.clerkId,
        "senderName": db_user.fullName or db_user.username
    }

@router.post("/friends/respond")
async def respond_friend_request(
    data: FriendRespondInput,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    clerkId = user.get("sub")
    db_user_res = await session.execute(select(User).where(User.clerkId == clerkId))
    db_user = db_user_res.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    fr_res = await session.execute(select(FriendRequest).where(FriendRequest.id == data.requestId))
    fr = fr_res.scalars().first()
    
    if not fr:
        raise HTTPException(status_code=404, detail="Friend request not found")
        
    if fr.receiverId != db_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this request")
        
    if data.action == "accept":
        fr.status = "accepted"
        session.add(fr)
    elif data.action == "reject":
        fr.status = "rejected"
        session.add(fr)
        # Optionally delete it or keep it as rejected
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    await session.commit()
    return {"success": True, "message": f"Request {data.action}ed"}

@router.get("/friends/status/{target_id}")
async def get_friend_status(
    target_id: str,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    clerkId = user.get("sub")
    db_user_res = await session.execute(select(User).where(User.clerkId == clerkId))
    db_user = db_user_res.scalars().first()
    if not db_user:
        return {"status": "none"}
        
    stmt = select(FriendRequest).where(
        or_(
            and_(FriendRequest.senderId == db_user.id, FriendRequest.receiverId == target_id),
            and_(FriendRequest.senderId == target_id, FriendRequest.receiverId == db_user.id)
        )
    )
    res = await session.execute(stmt)
    fr = res.scalars().first()
    
    if not fr:
        return {"status": "none"}
        
    if fr.status == "accepted":
        return {"status": "accepted"}
        
    if fr.status == "pending":
        if fr.senderId == db_user.id:
            return {"status": "pending_sent"}
        else:
            return {"status": "pending_received", "requestId": fr.id}
            
    return {"status": "none"}
