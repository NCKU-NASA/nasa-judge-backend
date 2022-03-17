#!/usr/bin/python3
import pymysql, sys, json, os
from dotenv import load_dotenv

load_dotenv()

# TODO: fill these values
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
table_name = 'score'

if len(sys.argv) < 4:
  print('Usage: ./dumprealLabScore.py <lab_id> <timestamp> <late_until>\nex: ./dumpScore.py Lab01 \'2022-02-25 20:00:00\' \'2022-03-04 20:00:00\'')
  sys.exit(1)

lab_id = sys.argv[1]
timestamp = sys.argv[2]
late_until = sys.argv[3]

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

# full lab score
cur = db.cursor()
cur.execute(f'SELECT studentId, MAX(score) FROM `{table_name}` WHERE labId=%s AND createAt<%s GROUP BY studentId, labId', (lab_id, timestamp))
rows = cur.fetchall()
lab_scores = { row[0] : row[1] for row in rows }


# 30 off lab score
cur = db.cursor()
cur.execute(f'SELECT studentId, MAX(score) FROM `{table_name}` WHERE labId=%s AND %s<createAt AND createAt<%s GROUP BY studentId, labId', (lab_id, timestamp, late_until))
rows = cur.fetchall()

for row in rows:
    lab_scores[row[0]] = max(lab_scores[row[0]] if row[0] in lab_scores else 0, int(row[1] * 0.7)) 

for user_id in lab_scores:
    print(f'{user_id}, {lab_scores[user_id]}')
