import asyncio
from sqlmodel import select
from app.core.database import async_session_factory
from app.models.match import Match, MatchPlayer
from app.models.player import User

async def main():
    async with async_session_factory() as session:
        # Get first user
        user = (await session.execute(select(User))).scalars().first()
        print(f"User ID: {user.id}")
        
        matches = (await session.execute(select(Match).where(Match.hostId == user.id))).scalars().all()
        for m in matches:
            print(f"Match: {m.id} | Short ID: {m.shortId}")
            players = (await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == m.id))).scalars().all()
            print(f"  Players in DB for this match: {[p.userId for p in players]}")
            
            # Check if condition matches
            p = (await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == m.id, MatchPlayer.userId == user.id))).scalars().first()
            if p:
                print(f"  --> FOUND PLAYER: {p.userId}")
            else:
                print(f"  --> PLAYER NOT FOUND WITH WHERE CLAUSE!")

if __name__ == "__main__":
    asyncio.run(main())
