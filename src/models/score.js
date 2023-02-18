const con = require('../utils/database');
const Lab = require('../models/lab');
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
      username varchar(255),\
      labId varchar(255),\
      score int,\
      result text,\
      FOREIGN KEY (username) REFERENCES user(username),\
      FOREIGN KEY (labId) REFERENCES lab(id),\
      createAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP\
    )', [tableName]);
  }
});

function getMaxLabScore(username, labId) {
  const lab = await Lab.getLab(labId);
  return new Promise((resolve, reject) => {
    Promise.all(lab.deadlines.map((deadline) => {
      new Promise((resolve, reject) => {
        con.query('SELECT MAX(score) AS maxScore FROM ?? WHERE username=? AND labId=? AND createAt<?'
        , [tableName, username, labId, (deadline.time || '9999-12-30 23:59:59')], (err, row) => {
          if (err) {
            reject(err);
          }
          resolve((row.length !== 1) ? 0 : row[0].maxScore*(deadline.score || 0));
          lab.deadlines.map((deadline))
        });
      });
    })).then((result) => {
        resolve(Math.max(...result));
    }, (error) => {
        reject(error);
    });
  });
}

function getResult(username = '%', labId = '%', usedeadline = false) {
  return new Promise((resolve, reject) => {
    con.query('SELECT * FROM ?? WHERE username like ? AND labId like ?', [tableName, username, labId], (err, row) => {
      if (err) {
        reject(err);
      }
      if(usedeadline) 
      {
        var labs = await Lab.getLabs();
        labs = Object.fromEntries(labs.map(lab => {
          let { id, ...obj } = lab;
          return [lab.id, obj];
        }));
      }
      rows.forEach((row) => {
        try {
          row.result = JSON.parse(row.result);
          if(usedeadline)
          {
            for(var i = 0; i < labs[row.labId].deadlines.length; i++) {
              if(Date.now() < Date.parse(labs[row.labId].deadlines[i].time)){
                row.score = row.score * labs[row.labId].deadlines[i].score;
                break;
              }
            }
          }
        } catch(err) {
          reject(err);
        }
      });
      resolve(rows);
    })
  })
}

function addScore(username, labId, score, result) {
  return new Promise((resolve, reject) => {
    try {
      result = JSON.stringify(result);
    } catch(err) {
      reject(err);
    }
    con.query('INSERT INTO ?? (username, labId, score, result) VALUES (?, ?, ?, ?)'
      , [tableName, username, labId, score, result], (err) => {
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
  getResult,
  addScore,
};