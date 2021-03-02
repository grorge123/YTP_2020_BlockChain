import requests as re
from bs4 import BeautifulSoup
import json
import random

url = 'https://fc.efoodex.net/portal.php?oid='

idx = 156566
# idx = 152264

output = []
while len(output) < 30 :
    print(idx, len(output))
    now = re.get(url + str(idx))
    if now.text != 'No Data':
        print('get')
        soup = BeautifulSoup(now.text, 'html.parser')
        title = soup.find_all('h1')[0].text
        title = title.replace('\t', '')
        title = title.replace('\n', '')
        data = soup.find_all(class_='username')[0].text.replace('\t','')
        data += '\n連結網址：'+url+str(idx)
        img = soup.find_all('img')[0]['src']
        flag = False
        for i in data.split('\n'):
            if i.find('有效日期：') != -1:
                ti = i[5:].split('-')
                if (int(ti[1]) == 3 and int(ti[2]) > 20 ) or int(ti[1]) > 3:
                    flag = True
        if img.find('http') == -1:
            # flag = False
            img = '../img/no.png'
        if flag:
            output.append([title, data, img])
    idx += 1

with open('food.json', 'w', encoding='utf-8') as js:
    data = []
    for i in output:
        data.append({
            'foodTitle': i[0],\
            'foodDescript': i[1],\
            'foodValue': random.randint(10, 100),\
            'foodSrc' : i[2],
            'foodX' : random.randint(0, 30),
            'foodY' : random.randint(0, 30)
        })
    json.dump(data, js, ensure_ascii=False)