const con = require('../utils/database');
const Lab = require('../models/lab');
const User = require('../models/user');
const tableName = 'score';

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
      id bigint AUTO_INCREMENT PRIMARY KEY,\
      username varchar(255),\
      labId varchar(255),\
      score int,\
      result text,\
      FOREIGN KEY (username) REFERENCES user(username),\
      createAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP\
    )', [tableName]);
  }
});

async function getMaxLabScore(username, labId) {
  const lab = await Lab.getLab(labId);
  
  const result = await Promise.all(lab.deadlines.map((deadline) => {
    return new Promise((resolve, reject) => {
      con.query('SELECT MAX(score) AS maxScore FROM ?? WHERE username=? AND labId=? AND createAt<?'
      , [tableName, username, labId, (deadline.time || '9999-12-30 23:59:59')], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve((row.length !== 1) ? 0 : row[0].maxScore*(deadline.score || 0));
        }
      });
    });
  }))

  return Math.max(...result);
}

async function getResult(args) {

  let labs = await Lab.getLabs();
  labs = Object.fromEntries(labs.map(lab => {
    const { id, ...obj } = lab;
    return [id, obj];
  }));

  let users = await User.getUsers();
  users = Object.fromEntries(users.map(user => {
    const { username, ...obj } = user;
    return [username, obj];
  }));


  if(args.groups) args.groups = JSON.parse(args.groups);

  if(!args.username && args.studentId) {
    const userdata = await User.getUser({studentId: args.studentId});
    if(userdata) args.username = userdata.username;
    else args.username = 'undefined';
  }

  return await new Promise((resolve, reject) => {
    con.query('SELECT * FROM ?? WHERE username like ? AND labId like ? AND score like ?', [tableName, (args.username || '%'), (args.labId || '%'), (args.score || '%')], async (err, rows) => {
      allscore = {};
      if (args.labId) allscore[args.labId] = {};
      for(var i = 0; i < rows.length; i++) {
        try {
          rows[i].result = JSON.parse(rows[i].result);
          rows[i].createAt = rows[i].createAt.toISOZoneString()
          if(String(args.usedeadline).toLowerCase() == 'true')
          {
            let calced = false;
            for(var k = 0; labs[rows[i].labId] && k < labs[rows[i].labId].deadlines.length; k++) {
              if(Date.parse(rows[i].createAt) < Date.parse(labs[rows[i].labId].deadlines[k].time || '9999-12-30 23:59:59')){
                rows[i].score = rows[i].score * labs[rows[i].labId].deadlines[k].score;
                calced = true;
                break;
              }
            }
            if(!calced) rows[i].score = 0;
          }
          let access = args.groups === undefined;
          if(args.groups) {
            args.groups.forEach((group) => {
              if (users[rows[i].username].groups.includes(group.name) || group.name === "all") {
                access = group.show;
              }
            });
          }
          if (access) {
            studentId = (await User.getUser({username: rows[i].username})).studentId;
            nowdata = {username: rows[i].username, studentId, score: rows[i].score,createAt:rows[i].createAt};
            userkey = String(args.showkeyisstudentId).toLowerCase() == 'true' ? studentId : rows[i].username;
            if (String(args.showresult).toLowerCase() == 'true') nowdata.result = rows[i].result;
            if (!(rows[i].labId in allscore)) allscore[rows[i].labId] = {};
            if (!(String(args.max).toLowerCase() !== 'false')) {
              if (!(userkey in allscore[rows[i].labId])) allscore[rows[i].labId][userkey] = [];
              allscore[rows[i].labId][userkey].push(nowdata);
            } else {
              if (!(userkey in allscore[rows[i].labId]) || allscore[rows[i].labId][userkey].score < rows[i].score) allscore[rows[i].labId][userkey] = nowdata;
            }
          }
        } catch(err) {
          reject(err);
        }
      }
      resolve(allscore);
    }); 
  });
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
