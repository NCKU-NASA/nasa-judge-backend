const con = require('../utils/database');
const tableName = 'score';

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
      id bigint AUTO_INCREMENT PRIMARY KEY,\
      studentId varchar(255),\
      labId varchar(255),\
      score int,\
      result text,\
      FOREIGN KEY (studentId) REFERENCES user(studentId),\
      FOREIGN KEY (labId) REFERENCES lab(id),\
      createAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP\
    )', [tableName]);
  }
});

function getMaxLabScore(studentId, labId) {
  return new Promise((resolve, reject) => {
    con.query('SELECT MAX(score) AS maxScore FROM ?? WHERE studentId=? AND labId=?'
      , [tableName, studentId, labId], (err, row) => {
      if (err) {
        reject(err);
      }
      resolve((row.length !== 1) ? 0 : row[0].maxScore);
    })
  })
}

function addScore(studentId, labId, score, result) {
  return new Promise((resolve, reject) => {
    try {
      result = JSON.stringify(result);
    } catch(err) {
      reject(err);
    }
    con.query('INSERT INTO ?? (studentId, labId, score, result) VALUES (?, ?, ?, ?)'
      , [tableName, studentId, labId, score, result], (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

module.exports = {
  isExists,
  getMaxLabScore,
  addScore,
};