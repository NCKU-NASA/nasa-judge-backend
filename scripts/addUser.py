#!/usr/bin/python3
import pymysql, sys, json, os, hashlib, base64
from dotenv import load_dotenv

load_dotenv()

# TODO: fill these values
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
judgeurl = os.getenv('JUDGE_URL')
table_name = 'user'

if len(sys.argv) != 3:
  print('Usage: ./addUser.py <student_id> <password>')
  sys.exit(1)

student_id = sys.argv[1]
student_pass = base64.b64encode(hashlib.sha256(sys.argv[2].encode('utf-8')).digest()).decode('utf-8')

try:
  db = pymysql.connect(
    host='localhost',
    user=username,
    password=password,
    database=database,
  )
except Exception as err:
  print(err)
  sys.exit(1)

cur = db.cursor()
cur.execute(f'SELECT * FROM `{table_name}` WHERE studentId=%s', (student_id))
res = cur.fetchall()
if len(res) != 0:
  print(f'{student_id} already exists')
  sys.exit(0)

sql = f'INSERT INTO `{table_name}` (`studentId`, `password`) VALUES (%s, %s)'
cur.execute(sql, (student_id, student_pass))
db.commit()
db.close()

try:
  os.mkdir(f'../files/{student_id}')
  os.system(f'chown -R www-data:www-data ../files/{student_id}')
#  os.system('ssh root@' + judgeurl.replace('http://','') + ' bash /etc/nasajudgeapi/addvpnuser.sh ' + student_id)
  os.system('bash /etc/nasajudgeapi/addvpnuser.sh ' + student_id)
except FileExistsError:
  print('Directory already exists')
