from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Optional

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User, UserRead

router = APIRouter(tags=["profile"])

@router.get("/check-username")
async def check_username(
    username: str,
    session: AsyncSession = Depends(get_session)
):
    """Check if a username is available."""
    if not username:
        return {"available": False}
        
    result = await session.execute(
        select(User).where(User.username == username.lower())
    )
    user = result.scalars().first()
    
    return {"available": user is None}


from pydantic import BaseModel

class ProfileCreate(BaseModel):
    fullName: str
    username: str
    avatarUrl: Optional[str] = None
    
@router.post("/profile")
async def create_profile(
    profile_data: ProfileCreate,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    try:
        clerkId = user.get("sub")
        
        # Check if username is already taken by someone else
        existing_username = await session.execute(
            select(User).where(User.username == profile_data.username.lower())
        )
        existing_user = existing_username.scalars().first()
        
        if existing_user and existing_user.clerkId != clerkId:
            return {"success": False, "message": "Username already taken."}
            
        # Check if user already has a profile
        result = await session.execute(
            select(User).where(User.clerkId == clerkId)
        )
        db_user = result.scalars().first()
        
        if db_user:
            # Update existing
            db_user.fullName = profile_data.fullName
            db_user.username = profile_data.username.lower()
            if profile_data.avatarUrl:
                db_user.avatarUrl = profile_data.avatarUrl
            session.add(db_user)
        else:
            # Create new
            db_user = User(
                clerkId=clerkId,
                fullName=profile_data.fullName,
                username=profile_data.username.lower(),
                avatarUrl=profile_data.avatarUrl,
                overall=50
            )
            session.add(db_user)
            
        await session.commit()
        await session.refresh(db_user)
        
        return {"success": True, "message": "Profile saved successfully."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise


@router.get("/profile/me", response_model=UserRead)
async def get_my_profile(
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Get the authenticated user's full profile data."""
    clerkId = user.get("sub")
    result = await session.execute(
        select(User).where(User.clerkId == clerkId)
    )
    db_user = result.scalars().first()
    
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
        
    return db_user
