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
    const userdata = await getUser(process.env.DB_USER);
    if (!userdata) {
      try {
    	const password = crypto.createHmac("sha256", secret).update(process.env.DB_PASSWD).digest('base64');
        await addUser(process.env.DB_USER, password, "", "", groups=["admin"]);
      } catch(err) {}
    }
  })();
});

function getUser(username) {
  return new Promise((resolve, reject) => {
    if (!username) {
      reject('username empty');
    }
    con.query('SELECT * FROM ?? WHERE username=? LIMIT 1'
      , [tableName, username], (err, result) => {
      if (err) {
        reject(err);
      }
      if(result.length === 0) resolve(undefined);
      try {
        result[0].groups = JSON.parse(result[0].groups);
      } catch(err) {
        reject(err);
      }
      resolve(result[0]);
    });
  });
}

function getUserbyEmail(email) {
  return new Promise((resolve, reject) => {
    if (!email) {
      reject('email empty');
    }
    con.query('SELECT * FROM ?? WHERE email=? LIMIT 1'
      , [tableName, email], (err, result) => {
      if (err) {
        reject(err);
      }
      if(result.length === 0) resolve(undefined);
      try {
        result[0].groups = JSON.parse(result[0].groups);
      } catch(err) {
        reject(err);
      }
      resolve(result[0]);
    });
  });
}

function getUserbyStudentId(studentId) {
  return new Promise((resolve, reject) => {
    if (!studentId) {
      resolve(undefined);
    }
    con.query('SELECT * FROM ?? WHERE studentId=? LIMIT 1'
      , [tableName, studentId], (err, result) => {
      if (err) {
        reject(err);
      }
      if(result.length === 0) resolve(undefined);
      try {
        result[0].groups = JSON.parse(result[0].groups);
      } catch(err) {
        reject(err);
      }
      resolve(result[0]);
    });
  });
}

function getUserbyipindex(ipindex) {
  return new Promise((resolve, reject) => {
    if (!ipindex) {
      reject('ipindex empty');
    }
    con.query('SELECT * FROM ?? WHERE ipindex=? LIMIT 1'
      , [tableName, ipindex], (err, result) => {
      if (err) {
        reject(err);
      }
      if(result.length === 0) resolve(undefined);
      try {
        result[0].groups = JSON.parse(result[0].groups);
      } catch(err) {
        reject(err);
      }
      resolve(result[0]);
    });
  });
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
  const alive = await judgeapi.get("alive");
  if(!alive.alive) throw "not alive";
  let body = await getUser(username);
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
    body = await getUser(username);
  }
  judgeapi.post("builduser", body);
}

module.exports = {
  isExists,
  addUser,
  getUserbyipindex,
  getUserbyEmail,
  getUserbyStudentId,
  getUser,
  getUsers,
};
