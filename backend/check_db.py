import asyncio, asyncpg, os
async def run():
    conn = await asyncpg.connect(os.environ['DATABASE_URL'])
    count = await conn.fetchval('SELECT count(*) FROM users;')
    print('Users count:', count)
    await conn.close()
asyncio.run(run())
