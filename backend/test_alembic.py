import asyncio, sys
async def main():
    p = await asyncio.create_subprocess_exec(sys.executable, '-m', 'alembic', 'upgrade', 'head', stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    out, err = await p.communicate()
    print('OUT:', out.decode())
    print('ERR:', err.decode())
    print('CODE:', p.returncode)
asyncio.run(main())
