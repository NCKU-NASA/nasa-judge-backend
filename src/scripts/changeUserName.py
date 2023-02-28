#!/usr/bin/python3
import pymysql, sys, json, os, hashlib, base64, json, requests
from dotenv import load_dotenv

load_dotenv()

# TODO: fill these values
dbusername = os.getenv('DB_USER')
dbpassword = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
judgeurl = os.getenv('JUDGE_URL')
table_name = 'user'

if len(sys.argv) != 3:
  print('Usage: ./changeUserName.py <studentId> <newusername>')
  sys.exit(1)

studentId = sys.argv[1]
username = sys.argv[2]

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
cur.execute(f'SELECT * FROM `{table_name}` WHERE studentId=%s', (studentId))
res = cur.fetchall()
if len(res) == 0:
  print(f'{studentId} not exists')
  sys.exit(0)

userdata = {"oldusername":res[0][0],"password":res[0][1], "studentId":res[0][2],"email":res[0][3],"ipindex":res[0][4],"groups":json.loads(res[0][5]),"username":username}

sql = f'UPDATE `{table_name}` SET username=%s WHERE studentId=%s'
cur.execute(sql, (username, studentId))
db.commit()
db.close()

requests.post(f"{judgeurl}/user/changename", json=userdata)

