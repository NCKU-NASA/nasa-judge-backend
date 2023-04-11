#!/usr/bin/python3
import pymysql, sys, json, os, hashlib, base64, json
from dotenv import load_dotenv

load_dotenv()

def help():
    print(f'''Usage: {sys.argv[0]} [options...]

Options:
  -h, --help                    display this help message and exit
  -u, --user                    User name
  -s, --studentId               Student Id
  -G, --groups GROUPS           Groups list
  -a, --add                     Add mode
  -r, --remove                  Remove mode''', file=sys.stderr)
    sys.exit(1)

# TODO: fill these values
dbusername = os.getenv('DB_USER')
dbpassword = os.getenv('DB_PASSWD')
database = os.getenv('DB_NAME')
judgeurl = os.getenv('JUDGE_URL')
table_name = 'user'

mode = 0
username = None
studentId = None
groups = None
i = 1
while i < len(sys.argv):
    if sys.argv[i] == '-h' or sys.argv[i] == '--help':
        help()
    elif sys.argv[i] == '-u' or sys.argv[i] == '--user':
        i += 1
        username = sys.argv[i]
    elif sys.argv[i] == '-s' or sys.argv[i] == '--studentId':
        i += 1
        studentId = sys.argv[i]
    elif sys.argv[i] == '-G' or sys.argv[i] == '--groups':
        i += 1
        groups = sys.argv[i].split(',')
    elif sys.argv[i] == '-a' or sys.argv[i] == '--add':
        mode = 1
    elif sys.argv[i] == '-r' or sys.argv[i] == '--remove':
        mode = -1
    else:
        help()
    i += 1

if (username == None and studentId == None) or (username != None and studentId != None) or groups == None:
    help()

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

search = "username=%s" if username != None else ("studentId=%s" if studentId != None else "")

cur = db.cursor()
cur.execute(f'SELECT * FROM `{table_name}` WHERE {search}', (username if username != None else (studentId if studentId != None else "")))
res = cur.fetchall()
if len(res) == 0:
  print(f'{(username if username != None else (studentId if studentId != None else ""))} not exists')
  sys.exit(0)

oldgroups = json.loads(res[0][5])

if mode == 0:
    oldgroups = groups
elif mode == 1:
    oldgroups += groups
elif mode == -1:
    for a in groups:
        if a in oldgroups:
            oldgroups.remove(a)

sql = f'UPDATE `{table_name}` SET groups=%s WHERE {search}'
cur.execute(sql, (json.dumps(oldgroups), (username if username != None else (studentId if studentId != None else ""))))
db.commit()
db.close()
