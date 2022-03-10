#!/usr/bin/python3
import pymysql, sys, json, os
from dotenv import load_dotenv

load_dotenv()

# TODO: fill these values
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
table_name = 'score'

if len(sys.argv) < 2:
  print('Usage: ./dumpLabScore.py <lab_id> [<timestamp>]\nex: ./dumpScore.py Lab01 \'2022-02-25 20:00:00\'')
  sys.exit(1)

lab_id = sys.argv[1]
timestamp = None
if len(sys.argv) == 3:
  timestamp = sys.argv[2]

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
if timestamp:
  cur.execute(f'SELECT studentId, MAX(score) FROM `{table_name}` WHERE labId=%s AND createAt<%s GROUP BY studentId, labId', (lab_id, timestamp))
else:
  cur.execute(f'SELECT studentId, MAX(score) FROM `{table_name}` WHERE labId=%s GROUP BY studentId, labId', (lab_id))
rows = cur.fetchall()

for row in rows:
  print(f'{row[0]},{row[1]}')
