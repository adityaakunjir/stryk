"""
ml_endpoints.py
───────────────
ML-powered OVR endpoints for STRYK.

GET  /api/v1/ml/ovr-breakdown?userId=…
    Returns current OVR, position-importance weights, explain_ovr string,
    and a per-stat contribution breakdown.  Powers the OVR Breakdown UI card.

POST /api/v1/ml/predict-ovr
    Accepts a position + stat values and returns a live predicted OVR integer.
    Used by the onboarding flow before a player's stats are saved.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User

# Import ML layer — graceful fallback is handled inside ovr_predictor itself
from ml.ovr_predictor import (
    explain_ovr,
    get_position_weights,
    predict_ovr,
    _spec_weights,
    _normalise_position,
)

router = APIRouter(tags=["ml"])


# ── helpers ────────────────────────────────────────────────────────────────────

def _user_stats_dict(u: User) -> dict[str, float]:
    return {
        "pace":          float(u.pace or 60),
        "shooting":      float(u.shooting or 60),
        "passing":       float(u.passing or 60),
        "dribbling":     float(u.dribbling or 60),
        "defending":     float(u.defending or 60),
        "physical":      float(u.physical or 60),
        "gkDiving":      float(u.gkDiving or 20),
        "gkHandling":    float(u.gkHandling or 20),
        "gkKicking":     float(u.gkKicking or 20),
        "gkReflexes":    float(u.gkReflexes or 20),
        "gkPositioning": float(u.gkPositioning or 20),
    }


def _build_breakdown(
    position: str,
    stats: dict[str, float],
    ovr: int,
) -> list[dict]:
    """
    For each stat that has a position weight, return:
      stat        — stat key
      value       — current value (float)
      weight      — normalised position importance (0–1)
      contribution_pct — this stat's weighted contribution as % of total OVR
    """
    pos = _normalise_position(position)
    weights = _spec_weights(pos)

    # raw weighted contributions
    contributions: dict[str, float] = {}
    for stat, w in weights.items():
        val = stats.get(stat, 60.0)
        contributions[stat] = w * val

    total_contribution = sum(contributions.values()) or 1.0

    breakdown = []
    for stat, w in weights.items():
        val = stats.get(stat, 60.0)
        contrib = contributions[stat]
        breakdown.append({
            "stat":             stat,
            "value":            round(val, 1),
            "weight":           round(w, 4),
            "contribution_pct": round((contrib / total_contribution) * 100, 1),
        })

    # sort by contribution descending
    breakdown.sort(key=lambda x: x["contribution_pct"], reverse=True)
    return breakdown


# ── GET /api/v1/ml/ovr-breakdown ──────────────────────────────────────────────

@router.get("/ml/ovr-breakdown")
async def get_ovr_breakdown(
    userId: Optional[str] = Query(None, description="Player user ID. Omit to use current authenticated user."),
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns a full OVR breakdown for a player:
    - current_ovr         : integer OVR from the ML model
    - position            : player's position string
    - position_weights    : dict of stat -> normalised importance for that position
    - explanation         : human-readable explain_ovr string
    - breakdown           : per-stat list of {stat, value, weight, contribution_pct}
    """
    # resolve user
    if userId:
        result = await session.execute(select(User).where(User.id == userId))
        db_user = result.scalars().first()
        if not db_user:
            # try by clerkId as fallback
            result = await session.execute(select(User).where(User.clerkId == userId))
            db_user = result.scalars().first()
    else:
        clerkId = current_user.get("sub")
        result = await session.execute(select(User).where(User.clerkId == clerkId))
        db_user = result.scalars().first()

    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    stats = _user_stats_dict(db_user)
    pos   = db_user.position or "CM"

    # predict with ML model
    current_ovr = predict_ovr(
        position       = pos,
        pace           = stats["pace"],
        shooting       = stats["shooting"],
        passing        = stats["passing"],
        dribbling      = stats["dribbling"],
        defending      = stats["defending"],
        physical       = stats["physical"],
        gk_diving      = stats["gkDiving"],
        gk_handling    = stats["gkHandling"],
        gk_kicking     = stats["gkKicking"],
        gk_reflexes    = stats["gkReflexes"],
        gk_positioning = stats["gkPositioning"],
    )

    pos_weights  = get_position_weights(pos)
    explanation  = explain_ovr(pos, stats)
    breakdown    = _build_breakdown(pos, stats, current_ovr)

    # Calculate UPGRADE PATH (which stat gives max OVR boost if raised by +10)
    best_delta = 0
    best_stat = None
    for stat_name, w in pos_weights.items():
        if w > 0:
            test_stats = dict(stats)
            test_stats[stat_name] = min(99.0, test_stats[stat_name] + 10.0)
            test_ovr = predict_ovr(
                position=pos,
                pace=test_stats["pace"],
                shooting=test_stats["shooting"],
                passing=test_stats["passing"],
                dribbling=test_stats["dribbling"],
                defending=test_stats["defending"],
                physical=test_stats["physical"],
                gk_diving=test_stats["gkDiving"],
                gk_handling=test_stats["gkHandling"],
                gk_kicking=test_stats["gkKicking"],
                gk_reflexes=test_stats["gkReflexes"],
                gk_positioning=test_stats["gkPositioning"],
            )
            delta = test_ovr - current_ovr
            # tie break by weight if deltas are equal
            if delta > best_delta or (delta == best_delta and delta > 0 and w > pos_weights.get(best_stat, 0)):
                best_delta = delta
                best_stat = stat_name

    upgrade_path = None
    if best_stat and best_delta > 0:
        upgrade_path = {
            "stat": best_stat,
            "delta": best_delta,
        }

    return {
        "current_ovr":      current_ovr,
        "position":         pos,
        "position_weights": pos_weights,
        "explanation":      explanation,
        "breakdown":        breakdown,
        "upgrade_path":     upgrade_path,
    }


# ── POST /api/v1/ml/predict-ovr ───────────────────────────────────────────────

class PredictOVRRequest(BaseModel):
    position:      str   = Field(..., description="Football position (e.g. 'ST', 'GK')")
    pace:          float = Field(60.0, ge=1, le=99)
    shooting:      float = Field(60.0, ge=1, le=99)
    passing:       float = Field(60.0, ge=1, le=99)
    dribbling:     float = Field(60.0, ge=1, le=99)
    defending:     float = Field(60.0, ge=1, le=99)
    physical:      float = Field(60.0, ge=1, le=99)
    gkDiving:      float = Field(20.0, ge=1, le=99)
    gkHandling:    float = Field(20.0, ge=1, le=99)
    gkKicking:     float = Field(20.0, ge=1, le=99)
    gkReflexes:    float = Field(20.0, ge=1, le=99)
    gkPositioning: float = Field(20.0, ge=1, le=99)


@router.post("/ml/predict-ovr")
async def post_predict_ovr(
    body: PredictOVRRequest,
    # no auth required — used during onboarding before account is fully set up
):
    """
    Live OVR preview endpoint for the onboarding flow.

    Accepts a position and stat values, returns:
    - predicted_ovr   : integer OVR from the ML model
    - explanation     : explain_ovr string (top drivers + improvement tip)
    - breakdown       : per-stat contribution breakdown
    """
    stats = {
        "pace":          body.pace,
        "shooting":      body.shooting,
        "passing":       body.passing,
        "dribbling":     body.dribbling,
        "defending":     body.defending,
        "physical":      body.physical,
        "gkDiving":      body.gkDiving,
        "gkHandling":    body.gkHandling,
        "gkKicking":     body.gkKicking,
        "gkReflexes":    body.gkReflexes,
        "gkPositioning": body.gkPositioning,
    }

    predicted_ovr = predict_ovr(
        position       = body.position,
        pace           = body.pace,
        shooting       = body.shooting,
        passing        = body.passing,
        dribbling      = body.dribbling,
        defending      = body.defending,
        physical       = body.physical,
        gk_diving      = body.gkDiving,
        gk_handling    = body.gkHandling,
        gk_kicking     = body.gkKicking,
        gk_reflexes    = body.gkReflexes,
        gk_positioning = body.gkPositioning,
    )

    explanation = explain_ovr(body.position, stats)
    breakdown   = _build_breakdown(body.position, stats, predicted_ovr)

    return {
        "predicted_ovr": predicted_ovr,
        "explanation":   explanation,
        "breakdown":     breakdown,
    }
