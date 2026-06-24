import re

with open("app/api/matches.py", "r") as f:
    content = f.read()

# Replace Match.id == payload.matchId
content = content.replace(
    "Match.id == payload.matchId",
    "((Match.id == payload.matchId) | (Match.shortId == payload.matchId))"
)

# For check_in (around line 585)
# Let's just find and replace the MatchPlayer query to resolve match first
check_in_fix = """
    match_result = await session.execute(
        select(Match).where((Match.id == payload.matchId) | (Match.shortId == payload.matchId))
    )
    match = match_result.scalars().first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    player_result = await session.execute(
        select(MatchPlayer).where(MatchPlayer.matchId == match.id, MatchPlayer.userId == db_user.id)
    )
"""

content = re.sub(
    r'    player_result = await session\.execute\(\s*select\(MatchPlayer\)\.where\(MatchPlayer\.matchId == payload\.matchId, MatchPlayer\.userId == db_user\.id\)\s*\)',
    check_in_fix.strip('\n'),
    content
)


with open("app/api/matches.py", "w") as f:
    f.write(content)

