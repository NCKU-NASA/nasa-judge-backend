const con = require('../utils/database'); 
const emailsender = require('../utils/email'); 
const fs = require('fs'); 
const hbs = require('hbs'); 
const crypto = require("crypto"); 
const secret = process.env.SECRET; 
const backendurl = process.env.URL; 
const tableName = 'confirm'; 
const timeout = 300;

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
  if (!result) {
    con.query('CREATE TABLE ?? (\
      token varchar(255) PRIMARY KEY,\
      username varchar(255) NOT NULL UNIQUE,\
      password varchar(255),\
      studentId varchar(255) NOT NULL UNIQUE,\
      email varchar(255) NOT NULL UNIQUE,\
      createAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP\
    )', [tableName]);
  }
});

function deleteExpired() {
  return new Promise((resolve, reject) => {
    const leasttime = new Date(Date.now() - (timeout * 1000)).toISOZoneString();
    con.query('DELETE FROM ?? WHERE createAt<?'
      , [tableName, leasttime], (err, result) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function popConfirm(token) {
  await deleteExpired();
  const output = await new Promise((resolve, reject) => {
    if (!token) {
      reject('token empty');
    }
    con.query('SELECT * FROM ?? WHERE token=? LIMIT 1'
      , [tableName, token], (err, result) => {
      if (err) reject(err);
      else if(result.length === 0) resolve(undefined);
      else resolve(result[0]);
    });
  });
  await new Promise((resolve, reject) => {
    if (!token) {
      reject('token empty');
    }
    con.query('DELETE FROM ?? WHERE token=?'
      , [tableName, token], (err, result) => {
      if (err) reject(err);
      else resolve();
    });
  });
  return output;
}

async function checkConfirmExist(username, studentId, email) {
  await deleteExpired();
  return await new Promise((resolve, reject) => {
    con.query('SELECT * FROM ?? WHERE username=? or studentId=? or email=? LIMIT 1'
      , [tableName, username, studentId, email], (err, result) => {
      if (err) reject(err);
      else resolve(result.length === 1);
    });
  });
}

async function newConfirm(username, password, studentId, email) {
  await deleteExpired();
  token = crypto.randomUUID();
  await new Promise((resolve, reject) => {
    con.query('INSERT INTO ?? (token, username, password, studentId, email) VALUES (?, ?, ?, ?, ?)'
      , [tableName, token, username, password, studentId, email], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
  const template = hbs.compile(fs.readFileSync('files/mail.html', 'utf8'));

  emailsender.sendMail({
      to: email,
      subject: "Activate NASAJudge account",
      html: template({
          url: backendurl,
          username: username,
          token: token,
      }),
  })
  return true;
}

module.exports = {
  isExists,
  checkConfirmExist,
  newConfirm,
  popConfirm,
};
