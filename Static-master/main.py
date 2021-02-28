import json
import requests as re
from bs4 import BeautifulSoup

ide = 152263
out = []
while len(out) < 100:
    now = re.get('https://fc.efoodex.net/portal.php?oid='+str(ide))
    if now != "No Data":
        out.append(ide)
    ide += 1

print(out)
