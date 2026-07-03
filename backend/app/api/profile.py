from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from typing import Optional

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User, UserRead

router = APIRouter(tags=["profile"])


def _card_frame_for_level(level: int) -> str:
    if level >= 16:
        return "gold"
    if level >= 6:
        return "silver"
    return "bronze"


def _sync_user_card_aliases(user: User) -> None:
    if not user.userId:
        user.userId = user.id
    if (user.matchesPlayed or 0) == 0:
        user.overall = 60
    user.avatar = user.avatarUrl
    user.OVR = user.overall
    user.PAC = user.pace
    user.SHO = user.shooting
    user.PAS = user.passing
    user.DRI = user.dribbling
    user.DEF = user.defending
    user.PHY = user.physical
    user.cardFrame = _card_frame_for_level(user.level or 1)

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

        await session.flush()
        _sync_user_card_aliases(db_user)
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

    # AUTO-HEAL: If this player has never played a match and their OVR is not 60,
    # their stats were saved with the wrong defaults. Recalculate dynamically now.
    # This self-heals the database on every login — no secret URL required.
    if db_user.matchesPlayed == 0 and db_user.position and db_user.playStyle:
        from app.core.stats import get_initial_stats
        new_stats = get_initial_stats(db_user.position, db_user.playStyle)
        stats_changed = False
        for stat_name, stat_val in new_stats.items():
            if hasattr(db_user, stat_name):
                current_val = getattr(db_user, stat_name)
                if abs(float(current_val) - float(stat_val)) > 0.5:
                    setattr(db_user, stat_name, stat_val)
                    stats_changed = True

        if stats_changed or db_user.overall != 60 or db_user.OVR != 60:
            db_user.overall = 60
            db_user.OVR = 60
            session.add(db_user)
            await session.commit()
            await session.refresh(db_user)

    if (db_user.matchesPlayed or 0) == 0:
        db_user.overall = 60
        db_user.OVR = 60

    _sync_user_card_aliases(db_user)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

class ProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    username: Optional[str] = None
    avatarUrl: Optional[str] = None
    position: Optional[str] = None
    playStyle: Optional[str] = None
    playstyle: Optional[str] = None
    strongFoot: Optional[str] = None
    bio: Optional[str] = None
    pace: Optional[int] = None
    shooting: Optional[int] = None
    passing: Optional[int] = None
    dribbling: Optional[int] = None
    defending: Optional[int] = None
    physical: Optional[int] = None
    gkDiving: Optional[int] = None
    gkHandling: Optional[int] = None
    gkKicking: Optional[int] = None
    gkReflexes: Optional[int] = None
    gkPositioning: Optional[int] = None
    overall: Optional[int] = None

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
    if "playstyle" in update_data:
        update_data["playStyle"] = update_data.pop("playstyle")
    
    # Check if we should generate new dynamic base stats
    needs_stat_reset = False
    if "position" in update_data or "playStyle" in update_data:
        if db_user.matchesPlayed == 0:
            needs_stat_reset = True

    # If the request explicitly provides stats, don't override those specific stats
    explicit_stats = {k for k in ["pace", "shooting", "passing", "dribbling", "defending", "physical", 
                                 "gkDiving", "gkHandling", "gkKicking", "gkReflexes", "gkPositioning"] 
                      if k in update_data}

    for key, value in update_data.items():
        setattr(db_user, key, value)

    if needs_stat_reset and not explicit_stats:
        from app.core.stats import get_initial_stats
        from ml.ovr_predictor import predict_ovr as _predict_ovr
        base_stats = get_initial_stats(db_user.position, db_user.playStyle)
        for stat_name, stat_val in base_stats.items():
            if hasattr(db_user, stat_name) and stat_name not in explicit_stats:
                setattr(db_user, stat_name, stat_val)
                
        db_user.overall = _predict_ovr(
            position=db_user.position,
            pace=db_user.pace, shooting=db_user.shooting,
            passing=db_user.passing, dribbling=db_user.dribbling,
            defending=db_user.defending, physical=db_user.physical,
            gk_diving=db_user.gkDiving, gk_handling=db_user.gkHandling,
            gk_kicking=db_user.gkKicking, gk_reflexes=db_user.gkReflexes,
            gk_positioning=db_user.gkPositioning,
        )
        db_user.OVR = db_user.overall
    elif explicit_stats or ("position" in update_data and explicit_stats):
        # We need to predict OVR using the provided explicit stats, if overall wasn't provided or we want to trust ML
        from ml.ovr_predictor import predict_ovr as _predict_ovr
        db_user.overall = _predict_ovr(
            position=db_user.position,
            pace=db_user.pace, shooting=db_user.shooting,
            passing=db_user.passing, dribbling=db_user.dribbling,
            defending=db_user.defending, physical=db_user.physical,
            gk_diving=db_user.gkDiving, gk_handling=db_user.gkHandling,
            gk_kicking=db_user.gkKicking, gk_reflexes=db_user.gkReflexes,
            gk_positioning=db_user.gkPositioning,
        )
        db_user.OVR = db_user.overall

    _sync_user_card_aliases(db_user)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

@router.post("/profile/me/history/{matchId}/star")
async def toggle_match_star(
    matchId: str,
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
        
    from app.models.match import MatchStats
    stats_result = await session.execute(
        select(MatchStats)
        .where(MatchStats.userId == db_user.id)
        .where(MatchStats.matchId == matchId)
    )
    db_stats = stats_result.scalars().first()
    
    if not db_stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match stats not found for this user."
        )
        
    db_stats.isStarred = not getattr(db_stats, "isStarred", False)
    session.add(db_stats)
    await session.commit()
    await session.refresh(db_stats)
    
    return {"success": True, "isStarred": db_stats.isStarred}

@router.get("/profile/fix-all-stats-secret-admin")
async def fix_all_stats(session: AsyncSession = Depends(get_session)):
    """Secret endpoint to forcefully fix stats for all existing users in production DB"""
    from app.core.stats import get_initial_stats
    from ml.ovr_predictor import predict_ovr as _predict_ovr
    from sqlalchemy import text
    
    # Force inject any missing columns into production PostgreSQL just in case it crashed earlier
    cols = [
        'xp INTEGER NOT NULL DEFAULT 0',
        'level INTEGER NOT NULL DEFAULT 1',
        '""needsUpgradeAnimation"" BOOLEAN NOT NULL DEFAULT FALSE',
        'pace FLOAT NOT NULL DEFAULT 60.0',
        'shooting FLOAT NOT NULL DEFAULT 60.0',
        'passing FLOAT NOT NULL DEFAULT 60.0',
        'dribbling FLOAT NOT NULL DEFAULT 60.0',
        'defending FLOAT NOT NULL DEFAULT 60.0',
        'physical FLOAT NOT NULL DEFAULT 60.0',
        '""gkDiving"" FLOAT NOT NULL DEFAULT 60.0',
        '""gkHandling"" FLOAT NOT NULL DEFAULT 60.0',
        '""gkKicking"" FLOAT NOT NULL DEFAULT 60.0',
        '""gkReflexes"" FLOAT NOT NULL DEFAULT 60.0',
        '""gkPositioning"" FLOAT NOT NULL DEFAULT 60.0',
        '""matchesPlayed"" INTEGER NOT NULL DEFAULT 0',
        'wins INTEGER NOT NULL DEFAULT 0',
        'losses INTEGER NOT NULL DEFAULT 0',
        'draws INTEGER NOT NULL DEFAULT 0',
        'goals INTEGER NOT NULL DEFAULT 0',
        'assists INTEGER NOT NULL DEFAULT 0',
        'tackles INTEGER NOT NULL DEFAULT 0',
        'saves INTEGER NOT NULL DEFAULT 0',
        'intercepts INTEGER NOT NULL DEFAULT 0',
        'overall FLOAT NOT NULL DEFAULT 60.0'
    ]
    for col in cols:
        try:
            await session.execute(text(f'ALTER TABLE users ADD COLUMN IF NOT EXISTS {col};'))
        except Exception:
            pass
    await session.commit()

    result = await session.execute(select(User))
    users = result.scalars().all()
    count = 0
    for u in users:
        new_stats = get_initial_stats(u.position, u.playStyle)
        u.pace = new_stats.get("pace", 60.0)
        u.shooting = new_stats.get("shooting", 60.0)
        u.passing = new_stats.get("passing", 60.0)
        u.dribbling = new_stats.get("dribbling", 60.0)
        u.defending = new_stats.get("defending", 60.0)
        u.physical = new_stats.get("physical", 60.0)
        u.gkDiving = new_stats.get("gkDiving", 60.0)
        u.gkHandling = new_stats.get("gkHandling", 60.0)
        u.gkKicking = new_stats.get("gkKicking", 60.0)
        u.gkReflexes = new_stats.get("gkReflexes", 60.0)
        u.gkPositioning = new_stats.get("gkPositioning", 60.0)
        
        if (u.matchesPlayed or 0) == 0:
            u.overall = 60
        else:
            u.overall = _predict_ovr(
                position=u.position,
                pace=u.pace, shooting=u.shooting,
                passing=u.passing, dribbling=u.dribbling,
                defending=u.defending, physical=u.physical,
                gk_diving=u.gkDiving, gk_handling=u.gkHandling,
                gk_kicking=u.gkKicking, gk_reflexes=u.gkReflexes,
                gk_positioning=u.gkPositioning,
            )
        u.OVR = u.overall
        session.add(u)
        count += 1
    await session.commit()
    return {"message": f"Successfully fixed stats for {count} users in the production database."}
