const crypto = require("crypto");
const con = require('../utils/database');
const judgeapi = require('../utils/judgeapi');
const secret = process.env.SECRET;
const tableName = 'user';

function isExists() {
  return new Promise((resolve, reject) => {
    con.query('SELECT * FROM information_schema.tables WHERE table_schema=? AND table_name=? LIMIT 1'
      , [process.env.DB_NAME, tableName], (err, result) => {
      if (err) {
        reject(err);
      }
      else resolve(result.length === 1);
    });
  });
}

isExists().then((result) => {
  (async function() {
    if (!result) {
      await new Promise((resolve,reject) => {
        con.query('CREATE TABLE ?? (\
          username varchar(255) PRIMARY KEY,\
          password varchar(255),\
          studentId varchar(255) NOT NULL,\
          email varchar(255) NOT NULL UNIQUE,\
          ipindex int NOT NULL UNIQUE AUTO_INCREMENT,\
          groups JSON\
        )', [tableName], (err, result) => {
          if(err) reject(err);
	  else resolve();
	});
      });
      await new Promise((resolve,reject) => {
        con.query('ALTER TABLE ?? AUTO_INCREMENT = 1', [tableName], (err, result) => {
          if(err) reject(err);
	  else resolve();
	});
      });
    }
    const userdata = await getUser({"username":process.env.DB_USER});
    if (!userdata) {
      try {
    	const password = crypto.createHmac("sha256", secret).update(process.env.DB_PASSWD).digest('base64');
        await addUser(process.env.DB_USER, password, "", "", groups=["admin"]);
      } catch(err) {}
    }
  })();
});

async function getUser(userdata) {
  if (!userdata) return undefined;
  for (var key in userdata) {
    const nowresult = await new Promise((resolve, reject) => {
      con.query(`SELECT * FROM ?? WHERE ${key.replaceAll(/[^0-9a-zA-Z.@_]/ig, "")}=? LIMIT 1`
        , [tableName, userdata[key]], (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if(result.length !== 0) {
          try {
            result[0].groups = JSON.parse(result[0].groups);
          } catch(err) {
            reject(err);
            return;
          }
          resolve(result[0]);
          return;
        }
        resolve(undefined);
      });
    });
    if(nowresult) return nowresult;
  }
  return undefined;
}

function getUsers() {
  return new Promise((resolve, reject) => {
    con.query('SELECT * FROM ??'
      , [tableName], (err, rows) => {
      if (err) {
        reject(err);
      }
      rows?.forEach((row) => {
        try {
          row.groups = JSON.parse(row.groups);
        } catch(err) {
          reject(err);
        }
      });
      resolve(rows);
    });
  });
}

async function addUser(username, password, studentId, email, groups=["guest"]) {
  groups = JSON.stringify(groups);
  const alive = await judgeapi.get("status/alive");
  if(!alive.alive) throw "not alive";
  let body = await getUser({username});
  if(!body) {
    await new Promise((resolve, reject) => {
      con.query('INSERT INTO ?? (username, password, studentId, email, groups) VALUES (?, ?, ?, ?, ?)'
        , [tableName, username, password, studentId, email, groups], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    body = await getUser({username});
  }
  judgeapi.post("user/build", body);
}

async function removefromgroup(username, group) {
  const body = await getUser({username});
  if(body) {
    body.groups = body.groups.filter(item => item !== group)
    groups = JSON.stringify(body.groups);
    await new Promise((resolve, reject) => {
      con.query('UPDATE ?? SET groups=? WHERE username=?'
        , [tableName, groups, username], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  return true;
}

async function appendtogroup(username, group) {
  const body = await getUser({username});
  if(body) {
    if(group) if(!body.groups.includes(group)) body.groups.push(group);
    groups = JSON.stringify(body.groups);
    await new Promise((resolve, reject) => {
      con.query('UPDATE ?? SET groups=? WHERE username=?'
        , [tableName, groups, username], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  return true;
}

async function changePasswd(username, password) {
  const body = await getUser({username});
  if(body) {
    await new Promise((resolve, reject) => {
      con.query('UPDATE ?? SET password=? WHERE username=?'
        , [tableName, password, username], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  return true;
}

module.exports = {
  isExists,
  addUser,
  changePasswd,
  removefromgroup,
  appendtogroup,
  getUser,
  getUsers,
};
