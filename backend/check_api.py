import requests

url = "https://stryk-backend-production.up.railway.app/api/v1/matches/"
try:
    r = requests.get(url)
    matches = r.json()
    for m in matches:
        print(f"Match {m['id']} - Title: {m['title']} - Host: {m['hostId']} - Participants: {m.get('participants', [])}")
except Exception as e:
    print(e)
