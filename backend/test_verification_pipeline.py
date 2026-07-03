import asyncio
from sqlmodel import select
from app.core.database import async_session_factory
from app.models.player import User
from app.models.match import Match, MatchStats, MatchPlayer, MatchVerification

from app.core.database import async_session_factory, engine
from sqlmodel import SQLModel

async def test_verification():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        
    async with async_session_factory() as session:
        import uuid
        test_match_id = uuid.uuid4().hex
        
        user1 = User(clerkId=uuid.uuid4().hex, username="test_host_"+test_match_id[:5], position="FW", pace=60.0, shooting=60.0, passing=60.0, dribbling=60.0, defending=60.0, physical=60.0, xp=0, level=1)
        user2 = User(clerkId=uuid.uuid4().hex, username="test_player_"+test_match_id[:5], position="MF", pace=60.0, shooting=60.0, passing=60.0, dribbling=60.0, defending=60.0, physical=60.0, xp=0, level=1)
        
        session.add(user1)
        session.add(user2)
        await session.commit()
        await session.refresh(user1)
        await session.refresh(user2)
        
        import datetime
        dt = datetime.datetime.now(datetime.timezone.utc)
        match = Match(id=test_match_id, hostId=user1.id, status="closed", title="Test Match", location="Test", matchDate=dt, scheduledAt=dt, format="3v3", maxPlayers=2, teamAScore=2, teamBScore=0)
        session.add(match)
        
        mp1 = MatchPlayer(matchId=test_match_id, userId=user1.id, team="A", checkedIn=True, status="checked_in")
        mp2 = MatchPlayer(matchId=test_match_id, userId=user2.id, team="B", checkedIn=True, status="checked_in")
        session.add(mp1)
        session.add(mp2)
        
        stats1 = MatchStats(matchId=test_match_id, userId=user1.id, status="pending_verification", goals=2, assists=0, tackles=0, saves=0)
        session.add(stats1)
        
        vote = MatchVerification(matchId=test_match_id, targetPlayerId=user1.id, verifierId=user2.id, vote=1)
        session.add(vote)
        
        await session.commit()

        from app.api.matches import complete_match
        mock_user = {"sub": user1.clerkId}
        
        try:
            result = await complete_match(test_match_id, user=mock_user, session=session)
            print("Complete Match Result:", result)
        except Exception as e:
            print("Error in complete_match:", e)
            
        await session.refresh(user1)
        await session.refresh(stats1)
        
        print(f"Stats Status: {stats1.status}")
        print(f"User XP: {user1.xp}")
        print(f"User Goals: {user1.goals}")
        print(f"User Shooting: {user1.shooting}")
        print(f"User MatchesPlayed: {user1.matchesPlayed}")
        print(f"User OVR: {user1.OVR}")

        # The user requested to print the feature importance explanation string for that player
        from ml.ovr_predictor import explain_ovr
        exp = explain_ovr(user1.position, {
            "pace": user1.pace, "shooting": user1.shooting, "passing": user1.passing,
            "dribbling": user1.dribbling, "defending": user1.defending, "physical": user1.physical
        })
        print(f"OVR Explanation: {exp}")

if __name__ == "__main__":
    asyncio.run(test_verification())
