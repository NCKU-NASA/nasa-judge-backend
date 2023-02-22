#!/usr/bin/python3
import pymysql, sys, json, os, hashlib, base64, json
from dotenv import load_dotenv

load_dotenv()

# TODO: fill these values
dbusername = os.getenv('DB_USER')
dbpassword = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
judgeurl = os.getenv('JUDGE_URL')
table_name = 'user'

if len(sys.argv) != 3:
  print('Usage: ./addUser.py <username> <groups>')
  sys.exit(1)

username = sys.argv[1]
groups = json.dumps(sys.argv[2].split(','))

try:
  db = pymysql.connect(
    host='localhost',
    user=dbusername,
    password=dbpassword,
    database=database,
  )
except Exception as err:
  print(err)
  sys.exit(1)

cur = db.cursor()
cur.execute(f'SELECT * FROM `{table_name}` WHERE username=%s', (username))
res = cur.fetchall()
if len(res) == 0:
  print(f'{username} not exists')
  sys.exit(0)

sql = f'UPDATE `{table_name}` SET groups=%s WHERE username=%s'
cur.execute(sql, (username, groups))
db.commit()
db.close()
