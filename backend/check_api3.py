import urllib.request; req = urllib.request.Request('https://stryk-production-4e4f.up.railway.app/health'); print(urllib.request.urlopen(req).read().decode('utf-8'))
