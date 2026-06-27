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
            
        # Process Base64 avatar if provided
        if profile_data.avatarUrl and profile_data.avatarUrl.startswith("data:image/"):
            try:
                import base64
                from io import BytesIO
                from PIL import Image
                import cloudinary.uploader
                
                # Extract base64
                header, encoded = profile_data.avatarUrl.split(",", 1)
                image_data = base64.b64decode(encoded)
                
                # Open with Pillow
                img = Image.open(BytesIO(image_data))
                img.thumbnail((500, 500)) # Resize for profile
                
                # Save as WebP to buffer
                webp_buffer = BytesIO()
                img.save(webp_buffer, format="WebP", quality=85)
                webp_buffer.seek(0)
                
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(
                    webp_buffer,
                    folder="stryk/avatars",
                    public_id=clerkId,
                    overwrite=True,
                    resource_type="image",
                    format="webp"
                )
                
                profile_data.avatarUrl = upload_result.get("secure_url")
            except Exception as e:
                print(f"Cloudinary upload failed: {e}")
                try:
                    import sentry_sdk
                    sentry_sdk.capture_exception(e)
                except ImportError:
                    pass
                # Fallback to the original base64 string if Cloudinary is not configured or fails
                # The avatarUrl already contains the base64 string.
                pass

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
                overall=60
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

class ProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    username: Optional[str] = None
    avatarUrl: Optional[str] = None
    position: Optional[str] = None
    playStyle: Optional[str] = None
    strongFoot: Optional[str] = None
    bio: Optional[str] = None

@router.patch("/profile/me", response_model=UserRead)
async def patch_my_profile(
    profile_update: ProfileUpdate,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
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

    update_data = profile_update.model_dump(exclude_unset=True)
    
    # Check if we should generate new dynamic base stats
    needs_stat_reset = False
    if "position" in update_data or "playStyle" in update_data:
        # Only reset if they are a new player (0 matches). 
        # Alternatively, if they have matches, we could also reset their base stats and simulate progression, 
        # but for now we only reset if they haven't played anything. Or we can just let it reset their base stats
        # wait, if they have 0 matches, they definitely need a reset.
        if db_user.matchesPlayed == 0:
            needs_stat_reset = True

    for key, value in update_data.items():
        setattr(db_user, key, value)

    if needs_stat_reset:
        from app.core.stats import get_initial_stats, calculate_ovr
        base_stats = get_initial_stats(db_user.position, db_user.playStyle)
        for stat_name, stat_val in base_stats.items():
            if hasattr(db_user, stat_name):
                setattr(db_user, stat_name, stat_val)
                
        # Recalculate OVR
        stats_dict = {
            "pace": db_user.pace,
            "shooting": db_user.shooting,
            "passing": db_user.passing,
            "dribbling": db_user.dribbling,
            "defending": db_user.defending,
            "physical": db_user.physical,
            "gkDiving": db_user.gkDiving,
            "gkHandling": db_user.gkHandling,
            "gkKicking": db_user.gkKicking,
            "gkReflexes": db_user.gkReflexes,
            "gkPositioning": db_user.gkPositioning
        }
        db_user.overall = calculate_ovr(db_user.position, stats_dict)

    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user
