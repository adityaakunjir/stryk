import asyncio
import os
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import sys

# Add backend dir to sys path so we can import app
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.core.database import async_session_factory, create_db_tables
from app.models.player import User
from app.models.match import Match, MatchStats
from app.api.matches import process_verified_stats

async def main():
    await create_db_tables()
    async with async_session_factory() as session:
        # Create 6 test users
        users = []
        import uuid
        run_id = uuid.uuid4().hex[:6]
        for i in range(6):
            u = User(
                username=f"prog_test_{run_id}_{i}",
                clerkId=f"test_clerk_{run_id}_{i}",
                fullName=f"Test ST {i}",
                position="ST"
            )
            # Give them base stats for ST
            from app.core.stats import get_initial_stats
            st_stats = get_initial_stats("ST", "Playmaker")
            for k, v in st_stats.items():
                setattr(u, k, v)
            u.progressionPoints = 0
            u.statCap = 75
            u.verifiedMatchCount = 0
            
            session.add(u)
            users.append(u)
            
        await session.commit()
        for u in users:
            await session.refresh(u)
            
        print("Created users.")
        
        from datetime import datetime
        m = Match(
            hostId=users[0].id,
            title="Test Match",
            location="Test Arena",
            matchDate=datetime.utcnow(),
            teamAScore=8,
            teamBScore=0,
            status="VERIFIED",
            format="3v3"
        )
        session.add(m)
        await session.commit()
        await session.refresh(m)
        
        print("Created match.")
        
        # Add players to match
        from app.models.match import MatchPlayer
        players = []
        for i in range(3):
            players.append(MatchPlayer(matchId=m.id, userId=users[i].id, team="A", status="joined"))
        for i in range(3, 6):
            players.append(MatchPlayer(matchId=m.id, userId=users[i].id, team="B", status="joined"))
            
        for p in players:
            session.add(p)
        await session.commit()
        
        # Create MatchStats
        stats_list = []
        # User 0: 5 goals, 0 assists (Top Scorer)
        stats_list.append(MatchStats(matchId=m.id, userId=users[0].id, goals=5, assists=0, team="A"))
        # User 1: 3 goals, 0 assists (Not top scorer)
        stats_list.append(MatchStats(matchId=m.id, userId=users[1].id, goals=3, assists=0, team="A"))
        # User 2: 0 goals, 3 assists (Top Assister)
        stats_list.append(MatchStats(matchId=m.id, userId=users[2].id, goals=0, assists=3, team="A"))
        # User 3,4,5: 0 goals, 0 assists
        stats_list.append(MatchStats(matchId=m.id, userId=users[3].id, goals=0, assists=0, team="B"))
        stats_list.append(MatchStats(matchId=m.id, userId=users[4].id, goals=0, assists=0, team="B"))
        stats_list.append(MatchStats(matchId=m.id, userId=users[5].id, goals=0, assists=0, team="B"))
        
        for s in stats_list:
            session.add(s)
        await session.commit()
        
        # Refresh match to load relations
        await session.refresh(m, ['stats', 'players'])
        for s in stats_list:
            await session.refresh(s, ['user'])
            
        # Call process_verified_stats manually (since this happens in background normally)
        for s in stats_list:
            process_verified_stats(session, s, m)
            
        await session.commit()
        
        # Verify points
        for u in users:
            await session.refresh(u)
            
        print("Points after match:")
        for i, u in enumerate(users):
            print(f"User {i}: {u.progressionPoints} points")
            
        assert users[0].progressionPoints == 5, f"User 0 should have 5 points, got {users[0].progressionPoints}" # 3 base + 2 top scorer
        assert users[1].progressionPoints == 3, f"User 1 should have 3 points, got {users[1].progressionPoints}" # 3 base
        assert users[2].progressionPoints == 4, f"User 2 should have 4 points, got {users[2].progressionPoints}" # 3 base + 1 top assister
        assert users[3].progressionPoints == 3, f"User 3 should have 3 points, got {users[3].progressionPoints}"
        
        print("Points calculation verified!")
        
        # Test API for spend points
        print("Testing spend points API")
        from fastapi.testclient import TestClient
        from app.main import app
        
        client = TestClient(app)
        
        def override_get_current_user():
            return {"sub": users[0].clerkId}
            
        from app.core.auth import get_current_user
        app.dependency_overrides[get_current_user] = override_get_current_user
        
        # Test 1: Spend valid points
        # User 0 has 5 points.
        res = client.post("/api/v1/player/spend-points", json={"pace": 2, "shooting": 3})
        print("Spend 5 points:", res.status_code, res.json())
        assert res.status_code == 200
        
        await session.refresh(users[0])
        assert users[0].progressionPoints == 0
        assert users[0].pace == 57 # 55 + 2
        assert users[0].shooting == 58 # 55 + 3
        
        # Give more points to test cap
        users[0].progressionPoints = 100
        await session.commit()
        
        # Pace is 57, cap is 75. 18 is allowed, 19 is not.
        res = client.post("/api/v1/player/spend-points", json={"pace": 19})
        print("Spend over cap:", res.status_code, res.json())
        assert res.status_code == 400
        assert "exceeds stat cap" in res.json()["detail"]
        
        res = client.post("/api/v1/player/spend-points", json={"pace": 18})
        print("Spend to cap:", res.status_code, res.json())
        assert res.status_code == 200
        
        await session.refresh(users[0])
        assert users[0].pace == 75
        
        # Cleanup
        for s in stats_list:
            await session.delete(s)
        await session.delete(m)
        for u in users:
            await session.delete(u)
        await session.commit()
        
        print("All tests passed!")

if __name__ == "__main__":
    asyncio.run(main())
