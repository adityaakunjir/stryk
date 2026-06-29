import asyncio
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:Aditya123%21@localhost:5432/stryk_db')
    async with engine.begin() as conn:
        cols = [
            'xp INTEGER NOT NULL DEFAULT 0',
            'level INTEGER NOT NULL DEFAULT 1',
            '"needsUpgradeAnimation" BOOLEAN NOT NULL DEFAULT FALSE',
            'pace FLOAT NOT NULL DEFAULT 60.0',
            'shooting FLOAT NOT NULL DEFAULT 60.0',
            'passing FLOAT NOT NULL DEFAULT 60.0',
            'dribbling FLOAT NOT NULL DEFAULT 60.0',
            'defending FLOAT NOT NULL DEFAULT 60.0',
            'physical FLOAT NOT NULL DEFAULT 60.0',
            '"gkDiving" FLOAT NOT NULL DEFAULT 60.0',
            '"gkHandling" FLOAT NOT NULL DEFAULT 60.0',
            '"gkKicking" FLOAT NOT NULL DEFAULT 60.0',
            '"gkReflexes" FLOAT NOT NULL DEFAULT 60.0',
            '"gkPositioning" FLOAT NOT NULL DEFAULT 60.0',
            '"matchesPlayed" INTEGER NOT NULL DEFAULT 0',
            'wins INTEGER NOT NULL DEFAULT 0',
            'losses INTEGER NOT NULL DEFAULT 0',
            'draws INTEGER NOT NULL DEFAULT 0',
            'goals INTEGER NOT NULL DEFAULT 0',
            'assists INTEGER NOT NULL DEFAULT 0',
            'tackles INTEGER NOT NULL DEFAULT 0',
            'saves INTEGER NOT NULL DEFAULT 0',
            'intercepts INTEGER NOT NULL DEFAULT 0',
            'overall FLOAT NOT NULL DEFAULT 60.0'
        ]
        for col in cols:
            try:
                await conn.execute(sa.text(f'ALTER TABLE users ADD COLUMN IF NOT EXISTS {col};'))
                print(f'Added {col}')
            except Exception as e:
                print(f'Failed {col}: {e}')

if __name__ == '__main__':
    asyncio.run(main())
