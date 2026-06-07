"""
STRYK Backend - Team Balancer API Router

Exposes a POST endpoint that accepts a list of players with ratings
and returns two balanced teams using the greedy partition algorithm.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.team_balancer import balance_teams

router = APIRouter(prefix="/balance", tags=["balance"])


# ─── Request / Response Schemas ────────────────────────────────────


class PlayerInput(BaseModel):
    """A single player in the balance request."""
    id: str | None = None
    username: str | None = None
    fullName: str | None = None
    avatarUrl: str | None = None
    position: str | None = None
    playStyle: str | None = None
    rating: int = Field(..., ge=0, le=99, description="Player overall rating (0-99)")


class BalanceRequest(BaseModel):
    """Request body for the team-balancer endpoint."""
    players: list[PlayerInput] = Field(..., min_length=2, description="List of players to balance")


class BalanceResponse(BaseModel):
    """Response body with two balanced teams."""
    teamA: list[PlayerInput]
    teamB: list[PlayerInput]
    ratingDiff: int


# ─── Endpoint ──────────────────────────────────────────────────────


@router.post("/teams", response_model=BalanceResponse)
async def balance_teams_endpoint(body: BalanceRequest):
    """
    Balance a list of players into two teams.

    The algorithm minimises the total rating difference between
    Team A and Team B using a greedy descending-rating partition.
    """
    players_dicts = [p.model_dump() for p in body.players]
    result = balance_teams(players_dicts)

    return BalanceResponse(
        teamA=[PlayerInput(**p) for p in result["teamA"]],
        teamB=[PlayerInput(**p) for p in result["teamB"]],
        ratingDiff=result["ratingDiff"],
    )
