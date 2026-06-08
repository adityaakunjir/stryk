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
if database_url.startswith("postgresql://"):
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
    """Create all SQLModel tables. Call during app startup."""
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
