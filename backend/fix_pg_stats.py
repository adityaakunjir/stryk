import asyncio
from sqlmodel import select
from app.core.database import async_session_factory
from app.models.player import User
from app.core.stats import get_initial_stats, calculate_ovr

async def fix():
    async with async_session_factory() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        count = 0
        for u in users:
            new_stats = get_initial_stats(u.position, u.playStyle)
            u.pace = new_stats.get('pace', 60.0)
            u.shooting = new_stats.get('shooting', 60.0)
            u.passing = new_stats.get('passing', 60.0)
            u.dribbling = new_stats.get('dribbling', 60.0)
            u.defending = new_stats.get('defending', 60.0)
            u.physical = new_stats.get('physical', 60.0)
            
            stats_dict = {
                'pace': u.pace,
                'shooting': u.shooting,
                'passing': u.passing,
                'dribbling': u.dribbling,
                'defending': u.defending,
                'physical': u.physical,
                'gkDiving': u.gkDiving,
                'gkHandling': u.gkHandling,
                'gkKicking': u.gkKicking,
                'gkReflexes': u.gkReflexes,
                'gkPositioning': u.gkPositioning
            }
            u.overall = calculate_ovr(u.position, stats_dict)
            session.add(u)
            count += 1
            print(f'Updated {u.fullName}: OVR {u.overall}, PAC {u.pace}, SHO {u.shooting}')
        await session.commit()
        print(f'Success: Recalculated dynamic 60 OVR stats for {count} users.')

if __name__ == '__main__':
    asyncio.run(fix())

