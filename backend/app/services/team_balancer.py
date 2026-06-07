"""
STRYK Backend - AI Team Balancer Service

Provides an intelligent team-balancing algorithm that distributes players
across two teams while minimizing the overall rating difference.

Algorithm: Greedy partition — sort descending by rating, then alternate
assignments to whichever team currently has the lower total.
This produces near-optimal results for typical lobby sizes (4v4 to 11v11).
"""

from typing import Any


def balance_teams(players: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """
    Split a list of player dicts into two balanced teams.

    Each player dict must contain at least a "rating" key (int).
    All other keys are preserved and passed through to the output.

    Returns {"teamA": [...], "teamB": [...], "ratingDiff": int}
    """
    if not players:
        return {"teamA": [], "teamB": [], "ratingDiff": 0}

    # Sort players by rating descending so the best players are placed first
    sorted_players = sorted(players, key=lambda p: p.get("rating", 0), reverse=True)

    team_a: list[dict[str, Any]] = []
    team_b: list[dict[str, Any]] = []
    sum_a = 0
    sum_b = 0

    for player in sorted_players:
        rating = player.get("rating", 0)
        # Assign to whichever team currently has the lower total rating
        if sum_a <= sum_b:
            team_a.append(player)
            sum_a += rating
        else:
            team_b.append(player)
            sum_b += rating

    return {
        "teamA": team_a,
        "teamB": team_b,
        "ratingDiff": abs(sum_a - sum_b),
    }
