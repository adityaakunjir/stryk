import asyncio
from datetime import datetime
from sqlmodel import select

from app.core.database import get_session
from app.models.match import Match
from app.models.player import User

async def run():
    async for session in get_session():
        db_user = (await session.execute(select(User))).scalars().first()
        if not db_user:
            print("No user found")
            return
            
        try:
            match = Match(
                title="Test Match",
                turf="Test Turf",
                location="Test Loc",
                matchDate=datetime.now(),
                format="6v6",
                maxPlayers=12,
                password=None,
                discordLink=None,
                hostId=db_user.id
            )
            session.add(match)
            await session.commit()
            print("Successfully created match!")
        except Exception as e:
            print("ERROR:")
            import traceback
            traceback.print_exc()
        finally:
            await session.close()
            break

asyncio.run(run())
