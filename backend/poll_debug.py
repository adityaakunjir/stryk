import time
import requests

url = "https://stryk-backend-production.up.railway.app/api/v1/matches/debug-players"
print(f"Waiting for endpoint {url}...")
for _ in range(10):
    try:
        r = requests.get(url)
        if r.status_code == 200:
            print(r.json())
            break
        print(f"Status: {r.status_code}")
    except Exception as e:
        print(e)
    time.sleep(5)
