"""Loopback-only disposable API for manual mobile tests.

Run: .venv/Scripts/python.exe test_recurring_preview.py
No real database, Clerk requests or migrations are used. Never deploy this file.
"""
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel import SQLModel
import app.models
from app.api.recurring import router, create_schedule, ScheduleCreate
from app.api.matches import router as matches_router
from app.api.reminders import router as reminders_router
from app.models.reminder import ReminderPreference, MatchReminder
from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User

engine = create_async_engine("sqlite+aiosqlite:///:memory:")
factory = async_sessionmaker(engine, expire_on_commit=False)


@asynccontextmanager
async def lifespan(app):
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async with factory() as session:
        session.add(User(id="preview-host", username="preview", clerkId="preview-clerk"))
        await session.commit()
        await create_schedule(ScheduleCreate(title="Preview weekly squad", location="Disposable fixture venue",
            firstLocal=datetime.now() + timedelta(days=3), timezone="Asia/Kolkata", weeks=3,
            requestKey="preview-seed-123"), {"sub": "preview-clerk"}, session)
        from sqlmodel import select
        from app.models.match import Match
        match = (await session.execute(select(Match))).scalars().first()
        session.add(ReminderPreference(userId="preview-host", enabled=True))
        session.add(MatchReminder(userId="preview-host", matchId=match.id,
            dedupeKey="preview-reminder", kind="kickoff", message="Preview weekly squad: kickoff within an hour. Check your game details.",
            expiresAt=datetime.now() + timedelta(hours=1)))
        await session.commit()
    yield
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(router, prefix="/api/v1")
app.include_router(matches_router, prefix="/api/v1")
app.include_router(reminders_router, prefix="/api/v1")


async def sessions():
    async with factory() as session:
        yield session


app.dependency_overrides[get_current_user] = lambda: {"sub": "preview-clerk"}
app.dependency_overrides[get_session] = sessions


@app.get("/api/v1/profile/me")
async def preview_profile():
    async with factory() as session:
        return (await session.get(User, "preview-host")).model_dump()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8011)
