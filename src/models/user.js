const con = require('../utils/database');
const judgeapi = require('../utils/judgeapi');
const tableName = 'user';

function isExists() {
  return new Promise((resolve, reject) => {
    con.query('SELECT * FROM information_schema.tables WHERE table_schema=? AND table_name=? LIMIT 1'
      , [process.env.DB_NAME, tableName], (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result.length === 1);
    });
  });
}

isExists().then((result) => {
  if (!result) {
    con.query('CREATE TABLE ?? (\
      username varchar(255) PRIMARY KEY,\
      password varchar(255),\
      studentId varchar(255),\
      ipindex int NOT NULL UNIQUE AUTO_INCREMENT,\
      groups JSON\
    )', [tableName]);
  }
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
      try {
        result[0].groups = JSON.parse(result[0].groups);
      } catch(err) {
        reject(err);
      }
      resolve(result.length === 0 ? undefined : result[0]);
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
      try {
        result[0].groups = JSON.parse(result[0].groups);
      } catch(err) {
        reject(err);
      }
      resolve(result.length === 0 ? undefined : result[0]);
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

function addUser(username, password, studentId) {
  return new Promise((resolve, reject) => {
    try {
      var groups = JSON.stringify(["guest"]);
    } catch(err) {
      reject(err);
    }
    judegapi.get("alive").then((alive) => {
      if(!result.alive) reject("not alive");
      con.query('INSERT INTO ?? (username, password, studentId, groups) VALUES (?, ?, ?, ?)'
        , [tableName, username, password, studentId, groups], (err) => {
        if (err) {
          reject(err);
        }
        const body = getUser(username);
        const result = judgeapi.post("builduser", body).then((result) => {
          resolve();
        }, (error) => {
          reject(error);
        });
      });
    }, (error) => {
      reject(error);
    });
  });
}

module.exports = {
  isExists,
  addUser,
  getUserbyipindex,
  getUser,
  getUsers,
};
