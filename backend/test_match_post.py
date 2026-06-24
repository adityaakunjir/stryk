import requests
import json

url = 'https://stryk-backend-production.up.railway.app/api/v1/matches/'
payload = {
    'title': 'Test Match',
    'location': 'Test',
    'date_time': '2026-06-25T20:00:00',
    'format': '7v7',
    'max_players': 14
}
headers = {'Content-Type': 'application/json'}
try:
    r = requests.post(url, json=payload)
    print(r.status_code)
    print(r.headers.get('content-type'))
    print(r.text)
except Exception as e:
    print(e)
