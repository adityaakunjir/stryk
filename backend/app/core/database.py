"""
STRYK Backend - Database Engine & Session

Provides async SQLModel engine and session factory
for connecting to the Supabase PostgreSQL instance.
"""

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# Determine database URL: default to local SQLite if DATABASE_URL is not configured
database_url = settings.database_url or "sqlite+aiosqlite:///./stryk.db"

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

# Create async engine
engine = create_async_engine(database_url, **engine_kwargs)

# Session factory
async_session_factory = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session():
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
