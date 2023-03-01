const express = require('express');
const createError = require('http-errors');
const Score = require('../models/score');
const Lab = require('../models/lab');
const User = require('../models/user');
const judgeapi = require('../utils/judgeapi');
const path = require('path');
const fs = require('fs');
const os = require('os');
const auth = require('../middlewares/auth');
const multer  = require('multer')
const router = express.Router();

//const uploadPath = path.join(__dirname, '../files');
const upload = multer({ dest: os.tmpdir() });
//const maxUploadCount = 20;

router.post('/', auth.checkSignIn, upload.any(), async function(req, res, next) {
  try {
    const username = req.session.user.username;
    const userdata = await User.getUser({username});
    if(!userdata) throw createError(404);
    const lab = await Lab.getLab(req.body.id);
    if(!lab) throw createError(404);
    let allow = lab.promissions.includes("all");
    userdata.groups.forEach(function(group) {
      if(lab.promissions.includes(group)) {
          allow = true;
      }
    });
    if(!allow) throw createError(404);
    const ipindex = userdata.ipindex;

    // send request to judge server
    const body = {
      labId: lab.id,
      username,
      ipindex,
      data: await placeDatas({"input":(input) => {
        return new Promise((resolve, reject) => {
          resolve(input || "");
        });
      }, "upload":(file) => {
        if (!file) throw createError(400, 'The number of files did not match');
        return new Promise((resolve, reject) => {
          fs.readFile(path.join(os.tmpdir(), file.filename), (err, data) => {
            if (err) {
              reject(err);
            }
            resolve(Buffer.from(data).toString('base64'));
          });
        });
      }}, lab),
    };
    const result = await judgeapi.post("score/judge", body);
    if(!result.alive) throw createError(404, 'Api server is not alive');
    if(!result.data.alive || !result.data.results) 
    {
      res.send({ alive: false });
      return;
    }
    let score = calcScore(result.data.results);

    // save score
    await Score.addScore(username, lab.id, score, result.data.results);

    for(var i = 0; i < lab.deadlines.length; i++) {
      if(Date.now() < Date.parse(lab.deadlines[i].time)) {
        sorce = score * lab.deadlines[i].score;
        break;
      }
    }

    res.send({ alive: result.data.alive, score, results: result.data.results, stdout: result.data.stdout, stderr: result.data.stderr });
  } catch(err) {
    next(err);
  }
  removeTempFiles(req.files);
});

router.get('/canjudge', auth.checkSignIn, async function(req, res, next) {
  try {
    const username = req.session.user.username;
    const result = await judgeapi.post("score/canjudge", {username});
    if(!result.alive) throw createError(404, 'Api server is not alive');
    else res.send(result.data);
  } catch(err) {
    next(err);
  }
});

function calcScore(judgeResult) {
  let score = 0;
  for (var key in judgeResult) {
    judgeResult[key].forEach((result) => {
      if (result.ans === true) {
        score += parseInt(result.weight);
      }
    })
  }
  return score;
}

async function placeDatas(solve, lab) {
  return Promise.all(lab.contents.map(async (content) => {
    return {
      type: content.type,
      name: content.name,
      data: await solve[content.type](data[content.type][content.name]),
    };
  }));
}

function removeTempFiles(files) {
  files.forEach((file) => {
    fs.rm(file.path, (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
}

module.exports = router;
