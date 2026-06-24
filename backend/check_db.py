import asyncio
from sqlmodel import select
from app.core.database import async_session_factory
from app.models.match import Match, MatchPlayer

async def main():
    async with async_session_factory() as session:
        matches = await session.execute(select(Match))
        all_matches = matches.scalars().all()
        for m in all_matches:
            players_res = await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == m.id))
            players = players_res.scalars().all()
            print(f"Match: {m.id} | Host: {m.hostId} | Players: {[p.userId for p in players]}")

if __name__ == "__main__":
    asyncio.run(main())
