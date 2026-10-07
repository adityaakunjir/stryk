"""Isolated integration checks: no production data and no network."""
import asyncio
import unittest
from datetime import datetime, timedelta
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel import SQLModel
import app.models
from app.api.dashboard import router
from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User
from app.models.match import Match, MatchPlayer, MatchStats, MatchInvite

class DashboardTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        self.factory = async_sessionmaker(self.engine, expire_on_commit=False)
        self.app = FastAPI()
        self.app.include_router(router)
        async def session():
            async with self.factory() as s:
                yield s
        self.app.dependency_overrides[get_session] = session
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "clerk-one"}
        async with self.factory() as s:
            now = datetime.utcnow()
            s.add_all([User(id="one", clerkId="clerk-one", username="one", xp=123, level=2),
                       User(id="two", clerkId="clerk-two", username="two")])
            s.add_all([
                Match(id="mine", title="My upcoming game", location="Pune", matchDate=now+timedelta(days=1), hostId="one"),
                Match(id="public", title="Open game", location="Pune", matchDate=now+timedelta(days=2), hostId="two"),
                Match(id="private", title="Private game", location="Pune", password="private", matchDate=now+timedelta(days=2), hostId="two"),
                Match(id="old", title="Old game", location="Pune", matchDate=now-timedelta(days=1), hostId="two"),
                Match(id="closed", title="Finished game", location="Pune", status="closed", matchDate=now-timedelta(hours=2), hostId="two"),
                Match(id="full", title="Full game", location="Pune", maxPlayers=1, matchDate=now+timedelta(days=1), hostId="two"),
            ])
            await s.flush()
            s.add_all([MatchPlayer(matchId="closed", userId="one"), MatchPlayer(matchId="closed", userId="two"),
                       MatchPlayer(matchId="full", userId="two"),
                       MatchStats(matchId="closed", userId="two"),
                       MatchInvite(matchId="public", senderId="two", receiverId="one")])
            await s.commit()

    async def asyncTearDown(self):
        await self.engine.dispose()

    async def request(self):
        async with AsyncClient(transport=ASGITransport(app=self.app), base_url="http://test") as client:
            return await client.get("/dashboard/week")

    async def test_week_filters_and_actions(self):
        response = await self.request()
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual([m["id"] for m in data["upcoming"]], ["mine"])
        self.assertEqual([m["id"] for m in data["available"]], ["public"])
        self.assertEqual({a["kind"] for a in data["actions"]}, {"submit", "verify"})
        self.assertEqual(data["pendingInvites"], 1)
        self.assertEqual(data["xp"], 123)

    async def test_missing_profile(self):
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "unknown"}
        self.assertEqual((await self.request()).status_code, 404)

    async def test_other_account_isolation(self):
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "clerk-two"}
        data = (await self.request()).json()
        self.assertNotIn("mine", [m["id"] for m in data["upcoming"]])
        self.assertEqual(data["pendingInvites"], 0)

if __name__ == "__main__":
    unittest.main()
