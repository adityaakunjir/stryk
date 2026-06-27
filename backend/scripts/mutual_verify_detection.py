import asyncio
import os
import sys
from datetime import datetime, timedelta
from sqlmodel import select, text

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_factory
from app.models.match import MatchVerification, MutualVerifyFlag
from app.models.player import User

async def detect_mutual_verification_rings():
    """
    Detects clusters/pairs of players where the mutual verification rate exceeds 90%.
    Flags these pairs for manual review by inserting them into the MutualVerifyFlag table.
    """
    print(f"[{datetime.utcnow().isoformat()}] Starting mutual verification detection job...")
    
    async with async_session_factory() as session:
        # Get all verifications
        result = await session.execute(
            select(MatchVerification).where(MatchVerification.vote == 1)
        )
        verifications = result.scalars().all()
        
        # Build a graph of verifications: graph[verifier_id][target_id] = count
        verify_counts = {}
        for v in verifications:
            if v.verifierId not in verify_counts:
                verify_counts[v.verifierId] = {}
            verify_counts[v.verifierId][v.targetPlayerId] = verify_counts[v.verifierId].get(v.targetPlayerId, 0) + 1
            
        flagged_count = 0
        
        # Check mutual verification rates
        processed_pairs = set()
        
        for player_a, targets in verify_counts.items():
            for player_b, a_to_b_count in targets.items():
                if player_a == player_b:
                    continue
                    
                pair_key = tuple(sorted([player_a, player_b]))
                if pair_key in processed_pairs:
                    continue
                processed_pairs.add(pair_key)
                
                b_to_a_count = verify_counts.get(player_b, {}).get(player_a, 0)
                
                # Minimum threshold to avoid flagging pairs with just 1 or 2 matches
                total_mutual = a_to_b_count + b_to_a_count
                if total_mutual < 4:
                    continue
                
                min_verify = min(a_to_b_count, b_to_a_count)
                max_verify = max(a_to_b_count, b_to_a_count)
                
                if max_verify == 0:
                    continue
                    
                mutual_rate = min_verify / max_verify
                
                if mutual_rate >= 0.90:
                    # They mutually verify each other > 90% of the time they verify each other
                    # Check if already flagged
                    existing = await session.execute(
                        select(MutualVerifyFlag).where(
                            ((MutualVerifyFlag.playerAId == pair_key[0]) & (MutualVerifyFlag.playerBId == pair_key[1]))
                        )
                    )
                    
                    if not existing.scalars().first():
                        flag = MutualVerifyFlag(
                            playerAId=pair_key[0],
                            playerBId=pair_key[1],
                            mutualVerifyCount=min_verify,
                            totalVerifyCount=max_verify
                        )
                        session.add(flag)
                        flagged_count += 1
                        print(f"Flagged pair: {pair_key[0]} <-> {pair_key[1]} ({min_verify}/{max_verify} mutual verifications)")
        
        await session.commit()
        print(f"[{datetime.utcnow().isoformat()}] Job complete. Flagged {flagged_count} new pairs.")

if __name__ == "__main__":
    asyncio.run(detect_mutual_verification_rings())
