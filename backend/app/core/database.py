"""
STRYK Backend - Database Engine & Session

Provides async SQLModel engine and session factory.
"""

from collections.abc import AsyncGenerator

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Default to local SQLite when DATABASE_URL is not configured.
database_url = settings.database_url or "sqlite+aiosqlite:///./stryk.db"
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Setup engine arguments (some are PostgreSQL-specific)
engine_kwargs = {
    "echo": settings.app_debug,
    "future": True,
}

if database_url.startswith("postgresql"):
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
    })
print(f"DATABASE_URL = {database_url}")
# Create async engine
engine = create_async_engine(database_url, **engine_kwargs)

# Session factory
async_session_factory = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_db_tables():
    """Create all SQLModel tables and run Alembic migrations. Call during app startup."""
    import logging
    import asyncio
    import os

    import sys
    try:
        logging.info("Running Alembic migrations via subprocess...")
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        
        # Run alembic upgrade head as a subprocess so we don't conflict with the current running event loop in env.py
        process = await asyncio.create_subprocess_exec(
            sys.executable, "-m", "alembic", "upgrade", "head",
            cwd=backend_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode == 0:
            logging.info(f"Alembic migrations completed successfully: {stdout.decode()}")
        else:
            logging.error(f"Alembic migration failed. exit={process.returncode} stderr={stderr.decode()}")
    except Exception as e:
        logging.error(f"Alembic subprocess failed: {e}")

    if engine is None:
        return
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        # Force avatarUrl and logoUrl to TEXT to support massive base64 strings
        from sqlalchemy import text
        try:
            await conn.execute(text('ALTER TABLE users ALTER COLUMN "avatarUrl" TYPE TEXT;'))
        except Exception:
            pass
        try:
            await conn.execute(text('ALTER TABLE teams ALTER COLUMN "logoUrl" TYPE TEXT;'))
        except Exception:
            pass
            
        # Raw SQL fallbacks in case Alembic fails or misses something during deployment
        try:
            # Users
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;'))
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;'))
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS "needsUpgradeAnimation" BOOLEAN NOT NULL DEFAULT FALSE;'))
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS pace FLOAT NOT NULL DEFAULT 60.0;'))
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS shooting FLOAT NOT NULL DEFAULT 60.0;'))
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS passing FLOAT NOT NULL DEFAULT 60.0;'))
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS dribbling FLOAT NOT NULL DEFAULT 60.0;'))
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS defending FLOAT NOT NULL DEFAULT 60.0;'))
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS physical FLOAT NOT NULL DEFAULT 60.0;'))
            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS gk FLOAT NOT NULL DEFAULT 60.0;'))
            
            # Matches
            await conn.execute(text('ALTER TABLE matches ADD COLUMN IF NOT EXISTS turf VARCHAR;'))
            await conn.execute(text('ALTER TABLE matches ADD COLUMN IF NOT EXISTS "discordLink" VARCHAR;'))
            await conn.execute(text('ALTER TABLE matches ADD COLUMN IF NOT EXISTS "teamAScore" INTEGER;'))
            await conn.execute(text('ALTER TABLE matches ADD COLUMN IF NOT EXISTS "teamBScore" INTEGER;'))
            
            # Match Stats
            stats_cols = [
                ("shotsOnTarget", "INTEGER NOT NULL DEFAULT 0"),
                ("keyPasses", "INTEGER NOT NULL DEFAULT 0"),
                ("interceptions", "INTEGER NOT NULL DEFAULT 0"),
                ("ballRecoveries", "INTEGER NOT NULL DEFAULT 0"),
                ("progressivePasses", "INTEGER NOT NULL DEFAULT 0"),
                ("blocks", "INTEGER NOT NULL DEFAULT 0"),
                ("clearances", "INTEGER NOT NULL DEFAULT 0"),
                ("bigSaves", "INTEGER NOT NULL DEFAULT 0"),
                ("penaltySaves", "INTEGER NOT NULL DEFAULT 0"),
                ("distributionAssists", "INTEGER NOT NULL DEFAULT 0"),
                ("duelsWon", "INTEGER NOT NULL DEFAULT 0"),
                ("aerialDuelsWon", "INTEGER NOT NULL DEFAULT 0"),
                ("yellowCards", "INTEGER NOT NULL DEFAULT 0"),
                ("redCards", "INTEGER NOT NULL DEFAULT 0"),
                ("ownGoals", "INTEGER NOT NULL DEFAULT 0"),
                ("noShow", "BOOLEAN NOT NULL DEFAULT FALSE"),
                ("status", "VARCHAR NOT NULL DEFAULT 'pending'"),
                ("verificationNote", "VARCHAR")
            ]
            for col, dtype in stats_cols:
                await conn.execute(text(f'ALTER TABLE match_stats ADD COLUMN IF NOT EXISTS "{col}" {dtype};'))
                
            # Match Verifications
            await conn.execute(text('ALTER TABLE match_verifications ADD COLUMN IF NOT EXISTS "disputeReason" VARCHAR;'))
        except Exception as e:
            logging.error(f"Raw SQL fallback for columns failed (expected on SQLite): {e}")
