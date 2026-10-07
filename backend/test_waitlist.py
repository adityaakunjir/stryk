"""FIFO standby and replacements on a disposable database; no production writes."""
import unittest
from datetime import datetime, timedelta
from sqlmodel import select
import test_match_capacity as capacity
from app.models.player import User
from app.models.match import Match, MatchPlayer, MatchInvite
from app.models.waitlist import MatchWaitlist
from app.models.reminder import MatchReminder

class WaitlistTests(unittest.IsolatedAsyncioTestCase):
    as_user = capacity.CapacityTests.as_user
    asyncTearDown = capacity.CapacityTests.asyncTearDown

    async def asyncSetUp(self):
        await capacity.CapacityTests.asyncSetUp(self)
        async with self.factory() as session:
            session.add(User(id="three", username="three", clerkId="three"))
            session.add(MatchPlayer(matchId="game", userId="one"))
            match = await session.get(Match, "game")
            match.status = "full"
            session.add(match)
            await session.commit()

    async def enqueue(self, user, password=None):
        self.as_user(user)
        return await self.client.post("/matches/game/waitlist", json={"password": password})

    async def test_fifo_leave_and_kick_promote_without_overfill(self):
        self.assertEqual((await self.enqueue("two")).json()["position"], 1)
        self.assertEqual((await self.enqueue("three")).json()["position"], 2)
        self.as_user("one")
        self.assertEqual((await self.client.post("/matches/leave", json={"matchId": "game"})).status_code, 200)
        roster = (await self.client.get("/matches/game")).json()["data"]
        self.assertEqual({p["userId"] for p in roster["participants"]}, {"host", "two"})
        self.assertEqual(roster["status"], "full")
        self.as_user("three")
        state = (await self.client.get("/matches/game/waitlist")).json()
        self.assertEqual((state["count"], state["position"]), (1, 1))
        self.assertEqual(state["standbys"], [])
        self.as_user("host")
        self.assertEqual((await self.client.get("/matches/game/waitlist")).json()["standbys"][0]["username"], "three")
        self.assertEqual((await self.client.post("/matches/game/kick", json={"userId": "two"})).status_code, 200)
        roster = (await self.client.get("/matches/game")).json()["data"]
        self.assertEqual({p["userId"] for p in roster["participants"]}, {"host", "three"})
        async with self.factory() as session:
            self.assertEqual((await session.execute(select(MatchWaitlist))).scalars().all(), [])
            notices = (await session.execute(select(MatchReminder))).scalars().all()
            self.assertEqual({r.userId for r in notices}, {"two", "three"})
            self.assertTrue(all(r.kind == "replacement" for r in notices))

    async def test_duplicate_retry_and_account_scoped_removal(self):
        first = await self.enqueue("two")
        self.assertEqual(first.status_code, 200, first.text)
        retry = await self.enqueue("two")
        self.assertEqual((retry.json()["count"], retry.json()["position"]), (1, 1))
        await self.enqueue("three")
        self.as_user("one")
        await self.client.delete("/matches/game/waitlist")
        self.as_user("two")
        state = (await self.client.delete("/matches/game/waitlist")).json()
        self.assertEqual((state["count"], state["position"]), (1, None))
        self.as_user("three")
        self.assertEqual((await self.client.get("/matches/game/waitlist")).json()["position"], 1)

    async def test_private_password_or_invitation_required(self):
        async with self.factory() as session:
            match = await session.get(Match, "game")
            match.password = "fixture"
            session.add(match)
            await session.commit()
        self.assertEqual((await self.enqueue("two")).status_code, 401)
        self.assertEqual((await self.enqueue("two", "fixture")).status_code, 200)
        async with self.factory() as session:
            session.add(MatchInvite(matchId="game", senderId="host", receiverId="three"))
            await session.commit()
        self.assertEqual((await self.enqueue("three")).status_code, 200)
        self.assertEqual((await self.enqueue("one", "fixture")).status_code, 409)

    async def test_cutoff_and_started_cancelled_games_never_promote(self):
        await self.enqueue("two")
        async with self.factory() as session:
            match = await session.get(Match, "game")
            match.matchDate = datetime.utcnow() - timedelta(minutes=1)
            session.add(match)
            await session.commit()
        self.assertEqual((await self.enqueue("three")).status_code, 409)
        self.as_user("one")
        await self.client.post("/matches/leave", json={"matchId": "game"})
        self.as_user("two")
        state = (await self.client.get("/matches/game/waitlist")).json()
        self.assertFalse(state["joined"])
        self.assertFalse(state["active"])
        for status in ("in_progress", "cancelled", "closed"):
            async with self.factory() as session:
                match = await session.get(Match, "game")
                match.status = status
                match.matchDate = datetime.utcnow() + timedelta(days=1)
                session.add(match)
                await session.commit()
            self.assertEqual((await self.enqueue("three")).status_code, 409)
        self.as_user("two")
        self.assertEqual((await self.client.delete("/matches/game/waitlist")).status_code, 200)

    async def test_open_capacity_uses_normal_join_not_standby(self):
        self.as_user("one")
        await self.client.post("/matches/leave", json={"matchId": "game"})
        self.assertEqual((await self.enqueue("two")).status_code, 409)

if __name__ == "__main__":
    unittest.main()
