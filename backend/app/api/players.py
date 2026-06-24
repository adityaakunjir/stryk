"""
STRYK Backend - Player API Router

CRUD endpoints for managing player profiles.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User, UserCreate, UserRead, UserUpdate
from datetime import datetime

router = APIRouter(prefix="/players", tags=["players"])


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_player(
    player_in: UserCreate,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Create a new player profile linked to the authenticated user."""
    # Ensure the profile is linked to the authenticated user.
    if player_in.clerkId != user.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create profile for a different user",
        )

    # Check if player already exists
    existing = await session.execute(
        select(User).where(User.clerkId == player_in.clerkId)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Player profile already exists",
        )

    player = User.model_validate(player_in)
    session.add(player)
    await session.flush()
    await session.refresh(player)
    return player


@router.get("/me", response_model=UserRead)
async def get_my_profile(
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Get the authenticated user's player profile."""
    clerkId = user.get("sub")
    result = await session.execute(
        select(User).where(User.clerkId == clerkId)
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found. Complete the onboarding wizard first.",
        )
    return player


@router.get("/username/{username}", response_model=UserRead)
async def get_player_by_username(
    username: str,
    session: AsyncSession = Depends(get_session),
):
    """Get a player profile by username (public)."""
    from sqlalchemy import func
    result = await session.execute(
        select(User).where(func.lower(User.username) == username.lower())
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found",
        )
    return player


@router.get("/{player_id}", response_model=UserRead)
async def get_player(
    player_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Get a player profile by ID (public)."""
    result = await session.execute(select(User).where(User.id == player_id))
    player = result.scalars().first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found",
        )
    return player



@router.patch("/me", response_model=UserRead)
async def update_my_profile(
    player_update: UserUpdate,
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    """Update the authenticated user's player profile."""
    clerkId = user.get("sub")
    result = await session.execute(
        select(User).where(User.clerkId == clerkId)
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

@router.post("/clear-upgrade")
async def clear_upgrade_animation(
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    clerkId = user.get("sub")
    result = await session.execute(
        select(User).where(User.clerkId == clerkId)
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player profile not found",
        )

    player.needsUpgradeAnimation = False
    session.add(player)
    await session.commit()
    return {"success": True}

from app.models.match import Match, MatchStats, XPLog, MatchPlayer, MatchTeam
from sqlalchemy.orm import selectinload

@router.get("/username/{username}/history")
async def get_player_history(
    username: str,
    session: AsyncSession = Depends(get_session),
):
    from sqlalchemy import func
    # 1. Look up user
    result = await session.execute(
        select(User).where(func.lower(User.username) == username.lower())
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found",
        )

    # 2. Get matches and stats where user has VERIFIED stats
    # Eagerly load the match and its teams
    stmt = (
        select(MatchStats)
        .where(MatchStats.userId == player.id)
        .where(MatchStats.status == "verified")
        .options(selectinload(MatchStats.match).selectinload(Match.teams))
        .order_by(MatchStats.id.desc())  # Approximate chronological order if date isn't directly on stats
    )
    stats_result = await session.execute(stmt)
    stats_list = stats_result.scalars().all()

    # Sort them by actual matchDate descending
    stats_list = sorted(stats_list, key=lambda s: s.match.matchDate if s.match else datetime.min, reverse=True)

    # 3. Collect MatchPlayers to know the player's team in each match
    player_match_ids = [s.matchId for s in stats_list]
    team_map = {}
    if player_match_ids:
        mp_stmt = select(MatchPlayer).where(MatchPlayer.userId == player.id).where(MatchPlayer.matchId.in_(player_match_ids))
        mp_result = await session.execute(mp_stmt)
        mps = mp_result.scalars().all()
        for mp in mps:
            team_map[mp.matchId] = mp.team

    # 4. Collect XP logs
    xp_map = {}
    if player_match_ids:
        from sqlalchemy import text
        xp_stmt = select(XPLog).where(XPLog.userId == player.id).where(XPLog.matchId.in_(player_match_ids))
        xp_result = await session.execute(xp_stmt)
        xps = xp_result.scalars().all()
        for x in xps:
            if x.matchId not in xp_map:
                xp_map[x.matchId] = 0
            xp_map[x.matchId] += x.amount

    # 5. Format response
    history = []
    for s in stats_list:
        m = s.match
        if not m:
            continue
            
        player_team = team_map.get(m.id, None)
        
        # Calculate outcome based on team scores
        outcome = "Unknown"
        if m.teamAScore is not None and m.teamBScore is not None and player_team:
            if player_team == "A":
                if m.teamAScore > m.teamBScore: outcome = "Win"
                elif m.teamAScore < m.teamBScore: outcome = "Loss"
                else: outcome = "Draw"
            elif player_team == "B":
                if m.teamBScore > m.teamAScore: outcome = "Win"
                elif m.teamBScore < m.teamAScore: outcome = "Loss"
                else: outcome = "Draw"

        history.append({
            "matchId": m.id,
            "title": m.title,
            "format": m.format,
            "matchDate": m.matchDate.isoformat(),
            "outcome": outcome,
            "team": player_team,
            "teamAScore": m.teamAScore,
            "teamBScore": m.teamBScore,
            "xpGained": xp_map.get(m.id, 0),
            "stats": {
                "goals": s.goals,
                "assists": s.assists,
                "saves": s.saves,
                "tackles": s.tackles,
                "cleanSheet": s.cleanSheet,
                "motm": s.motm,
                "yellowCards": s.yellowCards,
                "redCards": s.redCards,
                "ownGoals": s.ownGoals,
                "noShow": s.noShow
            }
        })

    return {"success": True, "data": history}
