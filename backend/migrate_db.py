import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

# Import all models so they are registered with SQLModel.metadata
from app.models.player import User
from app.models.team import Team, TeamMember, TeamInvite
from app.models.match import Match, MatchPlayer, MatchTeam, MatchInvite, MatchStats, MatchVerification, XPLog
from app.models.friend import FriendRequest

async def migrate():
    # Try to get Railway DATABASE_URL, fallback to local sqlite
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        db_path = os.path.join(os.path.dirname(__file__), "stryk.db")
        db_url = f"sqlite+aiosqlite:///{db_path}"
        print(f"No DATABASE_URL found. Using local SQLite database at {db_path}")
    else:
        # Railway provides postgres:// but asyncpg needs postgresql+asyncpg://
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        print("Using provided DATABASE_URL.")

    engine = create_async_engine(db_url, echo=True)
    
    async with engine.begin() as conn:
        print("Dropping all existing tables to apply new schema (WARNING: DATA LOSS)...")
        await conn.run_sync(SQLModel.metadata.drop_all)
        print("Creating new tables from SQLModel metadata...")
        await conn.run_sync(SQLModel.metadata.create_all)
        
    print("Database migration completed.")

if __name__ == "__main__":
    asyncio.run(migrate())

