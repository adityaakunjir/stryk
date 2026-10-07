"""Roster capacity regression tests on a disposable database.

SQLite verifies endpoint behavior, not PostgreSQL concurrent locking semantics.
"""
import unittest
from datetime import datetime, timedelta
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel import SQLModel, select
import app.models
from app.api.matches import router
from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User
from app.models.match import Match, MatchPlayer, MatchInvite

class CapacityTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        self.factory = async_sessionmaker(self.engine, expire_on_commit=False)
        self.app = FastAPI()
        self.app.include_router(router)
        async def sessions():
            async with self.factory() as session:
                yield session
        self.app.dependency_overrides[get_session] = sessions
        self.as_user("one")
        self.client = AsyncClient(transport=ASGITransport(app=self.app), base_url="http://test")
        async with self.factory() as session:
            session.add_all([User(id=x, username=x, clerkId=x) for x in ("host", "one", "two")])
            session.add(Match(id="game", shortId="QUEUE1", title="Capacity fixture", location="Fixture",
                hostId="host", maxPlayers=2, matchDate=datetime.utcnow()+timedelta(days=2)))
            await session.flush()
            session.add(MatchPlayer(matchId="game", userId="host"))
            session.add(MatchInvite(id="invite", matchId="game", senderId="host", receiverId="one"))
            await session.commit()

    def as_user(self, user):
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": user}

    async def asyncTearDown(self):
        await self.client.aclose()
        await self.engine.dispose()

    async def test_normal_join_fills_leave_reopens_and_code_join_respects_capacity(self):
        result = await self.client.post("/matches/join", json={"matchId": "game"})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()["data"]["status"], "full")
        self.as_user("two")
        self.assertEqual((await self.client.post("/matches/join-by-code", json={"code": "queue1"})).status_code, 400)
        self.as_user("one")
        self.assertEqual((await self.client.post("/matches/leave", json={"matchId": "game"})).status_code, 200)
        self.assertEqual((await self.client.get("/matches/game")).json()["data"]["status"], "open")
        self.as_user("two")
        result = await self.client.post("/matches/join-by-code", json={"code": "queue1"})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual(result.json()["data"]["players"], 2)

    async def test_invite_acceptance_fills_capacity_and_host_kick_reopens(self):
        result = await self.client.post("/matches/invites/invite/accept")
        self.assertEqual(result.status_code, 200, result.text)
        self.assertEqual((await self.client.get("/matches/game")).json()["data"]["status"], "full")
        self.as_user("host")
        self.assertEqual((await self.client.post("/matches/game/kick", json={"userId": "one"})).status_code, 200)
        self.assertEqual((await self.client.get("/matches/game")).json()["data"]["status"], "open")

    async def test_invites_cannot_join_cancelled_games_and_private_password_still_required(self):
        async with self.factory() as session:
            game = await session.get(Match, "game")
            game.password = "fixture-password"
            session.add(game)
            await session.commit()
        self.assertEqual((await self.client.post("/matches/join", json={"matchId": "game"})).status_code, 401)
        self.assertEqual((await self.client.post("/matches/join-by-code", json={"code": "QUEUE1"})).status_code, 401)
        async with self.factory() as session:
            game = await session.get(Match, "game")
            game.status = "cancelled"
            session.add(game)
            await session.commit()
        self.assertEqual((await self.client.post("/matches/invites/invite/accept")).status_code, 400)
        async with self.factory() as session:
            players = (await session.execute(select(MatchPlayer).where(MatchPlayer.matchId == "game"))).scalars().all()
            self.assertEqual(len(players), 1)

if __name__ == "__main__":
    unittest.main()
