import httpx
import asyncio

async def run():
    async with httpx.AsyncClient() as c:
        resp = await c.get('https://stryk-production-c476.up.railway.app/api/v1/')
        print(resp.status_code)

if __name__ == '__main__':
    asyncio.run(run())
