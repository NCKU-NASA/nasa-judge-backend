require('dotenv').config();
const fs = require('fs');
const path = require('path');
const User = require('../models/user');

const requiredVars = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWD',
  'SECRET',
  'JUDGE_URL',
];
const lackVars = [];

function createFilesDir() {
  fs.mkdirSync(path.join(__dirname, '../files/public'), { recursive: true });
}

async function createUserDir() {
  setTimeout(() => {
      User.getUsers()
    .then((users) => {
      users.map((user) => {
        fs.mkdirSync(path.join(__dirname, `../files/${user.studentId}`), { recursive: true });
      });
    })
    .catch((rej) => {
      console.error(`ERROR: Fail to get all userID ${rej}`)
    })
  }, 1500);
}

function config() {
  requiredVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      lackVars.push(envVar);
    }
  });
  if (lackVars.length !== 0) {
    console.error(`ERROR: Environment variables ${lackVars.join(', ')} not set.`);
    process.exit(1);
  }
  createFilesDir();
  createUserDir();
}

module.exports = {
  config
};

