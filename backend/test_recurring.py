"""Isolated scheduling integration tests, never writes production data."""
import unittest
from datetime import datetime, timedelta
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel import SQLModel, select
from sqlalchemy.orm import selectinload
import app.models
from app.api.recurring import router, occurrence_times
from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.player import User
from app.models.match import Match, MatchPlayer
from app.api.matches import _serialize_match, router as matches_router


class RecurringTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        self.factory = async_sessionmaker(self.engine, expire_on_commit=False)
        self.app = FastAPI()
        self.app.include_router(router)
        self.app.include_router(matches_router)
        async def sessions():
            async with self.factory() as session:
                yield session
        self.app.dependency_overrides[get_session] = sessions
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "host-clerk"}
        async with self.factory() as session:
            session.add_all([User(id="host", username="host", clerkId="host-clerk"),
                             User(id="other", username="other", clerkId="other-clerk")])
            await session.commit()
        self.client = AsyncClient(transport=ASGITransport(app=self.app), base_url="http://test")
        self.payload = {"title": "Sunday squad", "location": "Pune", "firstLocal":
            (datetime.utcnow() + timedelta(days=2)).isoformat(), "timezone": "Asia/Kolkata",
            "weeks": 4, "format": "5v5", "requestKey": "test-key-123"}

    async def asyncTearDown(self):
        await self.client.aclose()
        await self.engine.dispose()

    async def test_atomic_schedule_duplicate_retry_and_independent_rosters(self):
        response = await self.client.post("/recurring", json=self.payload)
        self.assertEqual(response.status_code, 201, response.text)
        schedule = response.json()
        self.assertEqual(len(schedule["occurrences"]), 4)
        self.assertTrue(all(g["players"] == 1 and g["joined"] for g in schedule["occurrences"]))
        retry = await self.client.post("/recurring", json=self.payload)
        self.assertEqual(retry.json()["id"], schedule["id"])
        async with self.factory() as session:
            games = (await session.execute(select(Match).options(
                selectinload(Match.players).selectinload(MatchPlayer.user)))).scalars().all()
            self.assertEqual(len(games), 4)
            self.assertEqual(games[1].matchDate - games[0].matchDate, timedelta(weeks=1))
            # Ordinary match pages must receive UTC offsets, not shift kickoff.
            for game in games:
                self.assertTrue(_serialize_match(game)["matchDate"].endswith("Z"))
            session.add(MatchPlayer(matchId=schedule["occurrences"][0]["id"], userId="other"))
            await session.commit()
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "other-clerk"}
        mine = (await self.client.get("/recurring")).json()
        self.assertEqual(len(mine), 1)
        self.assertFalse(mine[0]["isHost"])
        self.assertEqual([g["joined"] for g in mine[0]["occurrences"]], [True, False, False, False])
        self.assertEqual((await self.client.post(f'/recurring/{schedule["id"]}/stop')).status_code, 403)

    async def test_stop_preserves_started_matches_and_is_idempotent(self):
        schedule = (await self.client.post("/recurring", json=self.payload)).json()
        async with self.factory() as session:
            game = await session.get(Match, schedule["occurrences"][0]["id"])
            game.status = "in_progress"
            session.add(game)
            await session.commit()
        stopped = (await self.client.post(f'/recurring/{schedule["id"]}/stop')).json()
        self.assertFalse(stopped["active"])
        self.assertEqual([g["status"] for g in stopped["occurrences"]], ["in_progress", "cancelled", "cancelled", "cancelled"])
        self.assertEqual((await self.client.post(f'/recurring/{schedule["id"]}/stop')).status_code, 200)

    async def test_existing_match_join_path_and_cancelled_game(self):
        schedule = (await self.client.post("/recurring", json=self.payload)).json()
        first = schedule["occurrences"][0]["id"]
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "other-clerk"}
        joined = await self.client.post("/matches/join", json={"matchId": first})
        self.assertEqual(joined.status_code, 200, joined.text)
        self.assertTrue(joined.json()["data"]["matchDate"].endswith("Z"))
        self.assertEqual(joined.json()["data"]["recurringSeriesId"], schedule["id"])
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "host-clerk"}
        await self.client.post(f'/recurring/{schedule["id"]}/stop')
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "other-clerk"}
        cancelled = await self.client.post("/matches/join", json={"matchId": schedule["occurrences"][1]["id"]})
        self.assertEqual(cancelled.status_code, 400)

    async def test_invalid_schedule_and_account_isolation(self):
        for changes in ({"timezone": "not/a-zone"}, {"weeks": 13}, {"title": "  "},
                        {"firstLocal": "2000-01-01T10:00:00"}, {"firstLocal": "2030-01-01T10:00:00Z"}):
            response = await self.client.post("/recurring", json={**self.payload, **changes})
            self.assertEqual(response.status_code, 422, response.text)
        self.app.dependency_overrides[get_current_user] = lambda: {"sub": "other-clerk"}
        self.assertEqual((await self.client.get("/recurring")).json(), [])

    def test_dst_keeps_wall_clock_and_rejects_invalid_wall_times(self):
        dates = occurrence_times(datetime(2030, 3, 3, 18), "America/New_York", 2)
        self.assertEqual(dates[1] - dates[0], timedelta(days=7, hours=-1))
        from fastapi import HTTPException
        with self.assertRaises(HTTPException):
            occurrence_times(datetime(2030, 3, 10, 2, 30), "America/New_York", 2)


if __name__ == "__main__":
    unittest.main()
