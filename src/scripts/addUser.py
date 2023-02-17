#!/usr/bin/python3
import pymysql, sys, json, os, hashlib, base64
from dotenv import load_dotenv

load_dotenv()

# TODO: fill these values
dbusername = os.getenv('DB_USER')
dbpassword = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
judgeurl = os.getenv('JUDGE_URL')
table_name = 'user'

if len(sys.argv) != 3:
  print('Usage: ./addUser.py <username> <password>')
  sys.exit(1)

username = sys.argv[1]
password = base64.b64encode(hashlib.sha256(sys.argv[2].encode('utf-8')).digest()).decode('utf-8')

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
if len(res) != 0:
  print(f'{username} already exists')
  sys.exit(0)

sql = f'INSERT INTO `{table_name}` (`username`, `password`) VALUES (%s, %s)'
cur.execute(sql, (username, password))
db.commit()
db.close()

try:
  os.mkdir(f'../files/{username}')
  os.system(f'chown -R www-data:www-data ../files/{username}')

  os.system('ssh root@' + judgeurl.replace('http://','') + ' bash /etc/nasajudgeapi/addvpnuser.sh ' + username)
except FileExistsError:
  print('Directory already exists')
