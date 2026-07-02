"""
Leaderboard API for verified match performance.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.match import Match, MatchStats
from app.models.player import User


router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

CACHE_TTL_SECONDS = 300
_leaderboard_cache: dict[tuple[str, str, str], dict] = {}

VALID_CATEGORIES = {"overall", "goals", "assists", "cleanSheets", "xp", "ovr"}
VALID_TIMEFRAMES = {"weekly", "monthly", "allTime"}
VALID_FORMATS = {"3v3", "5v5", "6v6", "7v7", "11v11", "all"}


def invalidate_leaderboard_cache() -> None:
    _leaderboard_cache.clear()


def _normalize_category(category: str) -> str:
    if category == "overall":
        return "ovr"
    return category


def _timeframe_start(timeframe: str) -> Optional[datetime]:
    now = datetime.utcnow()
    if timeframe == "weekly":
        return now - timedelta(days=7)
    if timeframe == "monthly":
        return now - timedelta(days=30)
    return None


def _card_frame_for_level(level: int) -> str:
    if level >= 16:
        return "gold"
    if level >= 6:
        return "silver"
    return "bronze"


def _xp_from_stat(stat: MatchStats) -> int:
    return (stat.goals * 10) + (stat.assists * 7) + (15 if stat.cleanSheet else 0)


def _stat_value(entry: dict, category: str) -> int:
    if category == "goals":
        return entry["careerGoals"]
    if category == "assists":
        return entry["careerAssists"]
    if category == "cleanSheets":
        return entry["careerCleanSheets"]
    if category == "xp":
        return entry["xp"]
    return entry["OVR"]


def _serialize_entry(user: User, aggregates: dict, category: str) -> dict:
    level = user.level or 1
    entry = {
        "rank": 0,
        "userId": user.id,
        "username": user.username,
        "fullName": user.fullName,
        "avatarUrl": user.avatarUrl,
        "position": user.position,
        "playStyle": user.playStyle,
        "cardFrame": user.cardFrame or _card_frame_for_level(level),
        "level": level,
        "OVR": user.OVR or user.overall or 60,
        "xp": aggregates.get("xp", 0),
        "careerGoals": aggregates.get("goals", 0),
        "careerAssists": aggregates.get("assists", 0),
        "careerCleanSheets": aggregates.get("cleanSheets", 0),
        "matchesPlayed": aggregates.get("matchesPlayed", 0),
        "verifiedMatchesCount": aggregates.get("verifiedMatchesCount", 0),
        "stats": {},
    }
    entry["stats"] = {"category": category, "value": _stat_value(entry, category)}
    return entry


async def _build_leaderboard(
    session: AsyncSession,
    category: str,
    timeframe: str,
    match_format: str,
    *,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    use_cache: bool = True,
) -> list[dict]:
    category = _normalize_category(category)
    cache_key = (category, timeframe, match_format)
    now = datetime.utcnow()
    custom_window = start is not None or end is not None
    if use_cache and start is None and end is None:
        cached = _leaderboard_cache.get(cache_key)
        if cached and (now - cached["timestamp"]).total_seconds() < CACHE_TTL_SECONDS:
            return cached["data"]

    if start is None:
        start = _timeframe_start(timeframe)

    stmt = (
        select(MatchStats)
        .where(MatchStats.status == "verified")
        .options(selectinload(MatchStats.user), selectinload(MatchStats.match))
    )
    result = await session.execute(stmt)
    stats_rows = result.scalars().all()

    aggregates: dict[str, dict] = {}
    users: dict[str, User] = {}
    for stat in stats_rows:
        match = stat.match
        user = stat.user
        if not match or not user:
            continue
        if match_format != "all" and match.format != match_format:
            continue
        completed_at = match.completedAt or match.matchDate
        if isinstance(completed_at, str):
            try:
                completed_at = datetime.fromisoformat(completed_at.replace("Z", "+00:00")).replace(tzinfo=None)
            except Exception:
                pass

        if start and (not completed_at or completed_at < start):
            continue
        if end and (not completed_at or completed_at >= end):
            continue

        users[user.id] = user
        bucket = aggregates.setdefault(
            user.id,
            {"goals": 0, "assists": 0, "cleanSheets": 0, "xp": 0, "matchesPlayed": 0, "verifiedMatchesCount": 0},
        )
        bucket["goals"] += stat.goals
        bucket["assists"] += stat.assists
        bucket["cleanSheets"] += 1 if stat.cleanSheet else 0
        bucket["xp"] += _xp_from_stat(stat)
        bucket["matchesPlayed"] += 1
        bucket["verifiedMatchesCount"] += 1

    entries = [_serialize_entry(user, aggregates[user_id], category) for user_id, user in users.items()]
    entries.sort(key=lambda item: (_stat_value(item, category), item["OVR"], item["xp"], item["username"] or ""), reverse=True)
    for index, entry in enumerate(entries, start=1):
        entry["rank"] = index

    if use_cache and not custom_window:
        _leaderboard_cache[cache_key] = {"timestamp": now, "data": entries}
    return entries


async def _get_current_db_user(session: AsyncSession, user: dict) -> User:
    clerk_id = user.get("sub")
    result = await session.execute(select(User).where(User.clerkId == clerk_id))
    db_user = result.scalars().first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get("")
async def get_leaderboard(
    category: str = Query(default="overall"),
    timeframe: str = Query(default="allTime"),
    format: str = Query(default="all"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
):
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid leaderboard category")
    if timeframe not in VALID_TIMEFRAMES:
        raise HTTPException(status_code=400, detail="Invalid leaderboard timeframe")
    if format not in VALID_FORMATS:
        raise HTTPException(status_code=400, detail="Invalid leaderboard format")

    normalized_category = _normalize_category(category)
    entries = await _build_leaderboard(session, normalized_category, timeframe, format)
    start = (page - 1) * limit
    end = start + limit
    return {
        "success": True,
        "category": normalized_category,
        "timeframe": timeframe,
        "format": format,
        "page": page,
        "limit": limit,
        "totalPlayers": len(entries),
        "data": entries[start:end],
    }


@router.get("/me")
async def get_my_leaderboard_context(
    category: str = Query(default="overall"),
    timeframe: str = Query(default="allTime"),
    format: str = Query(default="all"),
    session: AsyncSession = Depends(get_session),
    user: dict = Depends(get_current_user),
):
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid leaderboard category")
    if timeframe not in VALID_TIMEFRAMES:
        raise HTTPException(status_code=400, detail="Invalid leaderboard timeframe")
    if format not in VALID_FORMATS:
        raise HTTPException(status_code=400, detail="Invalid leaderboard format")

    db_user = await _get_current_db_user(session, user)
    normalized_category = _normalize_category(category)
    entries = await _build_leaderboard(session, normalized_category, timeframe, format)
    my_index = next((idx for idx, entry in enumerate(entries) if entry["userId"] == db_user.id), None)

    if my_index is None:
        return {
            "success": True,
            "myRank": None,
            "totalPlayers": len(entries),
            "rankMovement": 0,
            "data": [],
            "me": {
                "rank": None,
                "userId": db_user.id,
                "username": db_user.username,
                "fullName": db_user.fullName,
                "avatarUrl": db_user.avatarUrl,
                "position": db_user.position,
                "playStyle": db_user.playStyle,
                "cardFrame": db_user.cardFrame or _card_frame_for_level(db_user.level or 1),
                "level": db_user.level or 1,
                "OVR": db_user.OVR or db_user.overall or 60,
                "xp": db_user.xp or 0,
                "careerGoals": db_user.goals or 0,
                "careerAssists": db_user.assists or 0,
                "careerCleanSheets": 0,
                "matchesPlayed": db_user.matchesPlayed or 0,
                "verifiedMatchesCount": 0,
                "stats": {"category": normalized_category, "value": 0},
            },
        }

    previous_start = datetime.utcnow() - timedelta(days=14)
    previous_end = datetime.utcnow() - timedelta(days=7)
    previous_entries = await _build_leaderboard(
        session,
        normalized_category,
        "weekly",
        format,
        start=previous_start,
        end=previous_end,
        use_cache=False,
    )
    previous_index = next((idx for idx, entry in enumerate(previous_entries) if entry["userId"] == db_user.id), None)
    rank_movement = 0 if previous_index is None else (previous_index + 1) - (my_index + 1)

    start = max(0, my_index - 2)
    end = min(len(entries), my_index + 3)
    return {
        "success": True,
        "myRank": my_index + 1,
        "totalPlayers": len(entries),
        "rankMovement": rank_movement,
        "data": entries[start:end],
        "me": entries[my_index],
    }
