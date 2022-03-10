const con = require('../utils/database');
const tableName = 'lab';

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
      id varchar(255) PRIMARY KEY,\
      contents JSON\
    )', [tableName]);
  }
});

function getLabs() {
  return new Promise((resolve, reject) => {
    con.query('SELECT * FROM ??'
      , [tableName], (err, rows) => {
      if (err) {
        reject(err);
      }
      rows.forEach((row) => {
        try {
          row.contents = JSON.parse(row.contents);
        } catch(err) {
          reject(err);
        }
      });
      resolve(rows);
    });
  });
}

function getLab(labId) {
  return new Promise((resolve, reject) => {
    con.query('SELECT * FROM ?? WHERE id=? LIMIT 1'
      , [tableName, labId], (err, row) => {
      if (err) {
        reject(err);
      }
      if (row.length !== 1) {
        resolve();
      }
      row = row[0];
      try {
        row.contents = JSON.parse(row.contents);
      } catch(err) {
        reject(err);
      }
      resolve(row);
    });
  });
}

module.exports = {
  getLabs,
  getLab,
};