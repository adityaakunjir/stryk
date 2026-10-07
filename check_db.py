import os
import psycopg2

url = os.environ.get('DATABASE_URL')
print('URL:', url)

if url:
    # Use psycopg2 to connect to the database
    # Need to make sure psycopg2 is installed in the local env
    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        cur.execute('SELECT username, "clerkId" FROM "user"')
        rows = cur.fetchall()
        for r in rows:
            print(f"Username: {r[0]}, ClerkID: {r[1]}")
    except Exception as e:
        print("Error:", e)
