#!/usr/bin/python3
import pymysql, sys, json, os
from dotenv import load_dotenv

load_dotenv()

# TODO: fill these values
dbusername = os.getenv('DB_USER')
dbpassword = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
table_name = 'score'

if len(sys.argv) != 6:
  print('Usage: ./addScore.py <username> <lab_id> <score> <resultpath> <createAt>')
  sys.exit(1)

username = sys.argv[1]
lab_id = sys.argv[2]
score = sys.argv[3]
path = sys.argv[4]
createAt = sys.argv[5]

with open(path, 'r') as f:
    result = f.read()
try:
  json.loads(result)
  db = pymysql.connect(
    host='localhost',
    user=dbusername,
    password=dbpassword,
    database=database,
  )
except Exception as err:
  print(err)
  sys.exit(1)

cur = db.cursor();
sql = f'INSERT INTO `{table_name}` (`username`, `labId`, `score`, `result`, `createAt`) VALUES (%s, %s, %s, %s, %s)'
cur.execute(sql, (username, lab_id, score, result, createAt))
db.commit()
db.close()
