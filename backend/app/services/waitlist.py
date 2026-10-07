"""FIFO replacements, called only while the caller holds the match row lock."""
from datetime import datetime, timedelta, timezone
from sqlmodel import select
from app.models.match import MatchPlayer
from app.models.waitlist import MatchWaitlist
from app.models.reminder import MatchReminder

def queue_open(match, now=None):
    now = now or datetime.utcnow()
    kickoff = match.matchDate
    if kickoff.tzinfo:
        kickoff = kickoff.astimezone(timezone.utc).replace(tzinfo=None)
    return match.status in ("open", "full") and kickoff > now

async def promote_waitlist(session, match):
    """Queue membership is explicit consent to join when a place becomes free."""
    if not queue_open(match):
        return []
    players = (await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == match.id))).scalars().all()
    member_ids = {p.userId for p in players}
    queue = (await session.execute(select(MatchWaitlist).where(MatchWaitlist.matchId == match.id)
        .order_by(MatchWaitlist.joinedAt, MatchWaitlist.id))).scalars().all()
    promoted = []
    count = len(players)
    for entry in queue:
        if entry.userId in member_ids:
            await session.delete(entry)
            continue
        if count >= match.maxPlayers:
            break
        session.add(MatchPlayer(matchId=match.id, userId=entry.userId))
        session.add(MatchReminder(userId=entry.userId, matchId=match.id,
            dedupeKey="waitlist:" + entry.id, kind="replacement",
            message=f"{match.title}: a spot opened and you’re now in the game. Check the roster and kickoff details."[:300],
            expiresAt=datetime.utcnow() + timedelta(days=1)))
        member_ids.add(entry.userId)
        promoted.append(entry.userId)
        count += 1
        await session.delete(entry)
    match.status = "full" if count >= match.maxPlayers else "open"
    session.add(match)
    await session.flush()
    return promoted
