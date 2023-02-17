#!/usr/bin/python3
import pymysql, sys, json, os
from dotenv import load_dotenv

load_dotenv()

# TODO: fill these values
username = os.getenv('DB_USER')
password = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
table_name = 'lab'

if len(sys.argv) != 3:
  print('Usage: ./addLab.py <lab_id> <file_path>')
  sys.exit(1)

lab_id = sys.argv[1]
path = sys.argv[2]

with open(path, 'r') as f:
  data = f.read()
try:
  json.loads(data)
  db = pymysql.connect(
    host='localhost',
    user=username,
    password=password,
    database=database,
  )
except Exception as err:
  print(err)
  sys.exit(1)

cur = db.cursor();
sql = f'INSERT INTO `{table_name}` (`id`, `contents`) VALUES (%s, %s)'
cur.execute(sql, (lab_id, data))
db.commit()
db.close()
