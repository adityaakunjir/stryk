"""
STRYK Backend - Player API Router

CRUD endpoints for managing player profiles.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import Player, PlayerCreate, PlayerRead, PlayerUpdate

router = APIRouter(prefix="/players", tags=["players"])


@router.post("/", response_model=PlayerRead, status_code=status.HTTP_201_CREATED)
async def create_player(
    player_in: PlayerCreate,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Create a new player profile linked to the authenticated Clerk user."""
    # Ensure clerk_user_id matches the authenticated user
    if player_in.clerk_user_id != user.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create profile for a different user",
        )

    # Check if player already exists
    existing = await session.execute(
        select(Player).where(Player.clerk_user_id == player_in.clerk_user_id)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Player profile already exists",
        )

    player = Player.model_validate(player_in)
    session.add(player)
    await session.flush()
    await session.refresh(player)
    return player


@router.get("/me", response_model=PlayerRead)
async def get_my_profile(
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Get the authenticated user's player profile."""
    clerk_id = user.get("sub")
    result = await session.execute(
        select(Player).where(Player.clerk_user_id == clerk_id)
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found. Complete the onboarding wizard first.",
        )
    return player


@router.get("/{player_id}", response_model=PlayerRead)
async def get_player(
    player_id: int,
    session: AsyncSession = Depends(get_session),
):
    """Get a player profile by ID (public)."""
    result = await session.execute(select(Player).where(Player.id == player_id))
    player = result.scalars().first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found",
        )
    return player


@router.patch("/me", response_model=PlayerRead)
async def update_my_profile(
    player_update: PlayerUpdate,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Update the authenticated user's player profile."""
    clerk_id = user.get("sub")
    result = await session.execute(
        select(Player).where(Player.clerk_user_id == clerk_id)
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found",
        )

    update_data = player_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(player, key, value)

    session.add(player)
    await session.flush()
    await session.refresh(player)
    return player
