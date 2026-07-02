"""
Background lifecycle maintenance for matches.
"""

import asyncio
import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.match import Match, MatchStats


PENDING_STATUSES = ("pending", "pending_verification", "flagged_peer_verification")


async def expire_overdue_verifications(session: AsyncSession) -> int:
    """Void unresolved stat submissions after the match verification deadline."""
    now = datetime.utcnow()
    match_result = await session.execute(
        select(Match).where(
            Match.status == "closed",
            Match.verificationDeadline.is_not(None),
            Match.verificationDeadline <= now,
        )
    )
    matches = match_result.scalars().all()
    if not matches:
        return 0

    expired_count = 0
    for match in matches:
        stats_result = await session.execute(
            select(MatchStats).where(
                MatchStats.matchId == match.id,
                MatchStats.status.in_(PENDING_STATUSES),
            )
        )
        for stat in stats_result.scalars().all():
            stat.status = "voided"
            session.add(stat)
            expired_count += 1

    return expired_count


async def match_lifecycle_worker(session_factory, interval_seconds: int = 300) -> None:
    """Poll for overdue verification windows while the API process is alive."""
    while True:
        try:
            async with session_factory() as session:
                expired_count = await expire_overdue_verifications(session)
                if expired_count:
                    await session.commit()
                    logging.info("Voided %s overdue match stat submissions.", expired_count)
                else:
                    await session.rollback()
        except asyncio.CancelledError:
            raise
        except Exception:
            logging.exception("Match lifecycle worker failed")

        await asyncio.sleep(interval_seconds)
