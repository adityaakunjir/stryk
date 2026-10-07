import urllib.request, urllib.error; req = urllib.request.Request('https://stryk-production-4e4f.up.railway.app/'); 
try: urllib.request.urlopen(req)
except urllib.error.HTTPError as e: print(e.read().decode('utf-8'))
