import asyncio, os, sys
from app.core.database import engine, get_session
from app.models.match import Match
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

async def main():
    async with AsyncSession(engine) as session:
        match = Match(
            title='Thursday',
            turf='Green Vibes',
            location='Shaniwar Peth',
            format='7v7',
            maxPlayers=14,
            hostId='test_user_id',
            matchDate=datetime.utcnow()
        )
        session.add(match)
        try:
            await session.commit()
            print('SUCCESS')
        except Exception as e:
            print('ERROR:', str(e))

asyncio.run(main())
