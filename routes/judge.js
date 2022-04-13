const express = require('express');
const createError = require('http-errors');
const Score = require('../models/score');
const Lab = require('../models/lab');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const auth = require('../middlewares/auth');
const multer  = require('multer')
const router = express.Router();

const uploadPath = path.join(__dirname, '../files');
const upload = multer({ dest: uploadPath });
const maxUploadCount = 20;
const judgeUrl = process.env.JUDGE_URL;

router.post('/', auth.checkSignIn, upload.array('uploads', maxUploadCount), async function(req, res, next) {
  try {
    const lab = await Lab.getLab(req.body.id);
    if (!lab) {
      throw createError(404);
    }
    const studentId = req.session.user.studentId;
    const fileContents = await placeUploadFiles(req.files, studentId, lab);
    const inputContents = placeInputs(req.body.inputs, lab);

    // send request to judge server
    const body = {
      labId: lab.id,
      studentId,
      data: fileContents.concat(inputContents),
    };
    const result = await axios.post(judgeUrl, body);
    const score = calcScore(result.data.results);

    // save score
    await Score.addScore(studentId, lab.id, score, result.data.results);

    res.send({ score, results: result.data.results, stdout: result.data.stdout, stderr: result.data.stderr });
  } catch(err) {
    next(err);
  }
  removeTempFiles(req.files);
});

function calcScore(judgeResult) {
  let score = 0;
  judgeResult.external.forEach((result) => {
    if (result.ans === true) {
      score += result.weight;
    }
  });
  judgeResult.internal.forEach((result) => {
    if (result.ans === true) {
      score += result.weight;
    }
  });
  return score;
}

// move files according to lab.contents[i].name and place every file in user's dir
function placeUploadFiles(files, subdir, lab) {
  // find upload entries
  const contents = lab.contents.filter((content) => content.type === 'upload');
  if (contents.length !== files.length) {
    throw createError(400, 'The number of files did not match');
  }
  // rename files
  files.forEach((file, i) => {
    fs.copyFileSync(path.join(uploadPath, file.filename), path.join(uploadPath, `${subdir}/${contents[i].name}`));
  });

  // read data
  return Promise.all(contents.map((content) => {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(uploadPath, `${subdir}/${content.name}`), (err, data) => {
        if (err) {
          reject(err);
        }
        resolve({
          type: 'file',
          name: content.name,
          data: Buffer.from(data).toString('base64'),
        });
      });
    });
  }));
}

function placeInputs(inputs, lab) {
  if (!inputs) {
    return [];
  }
  if (!Array.isArray(inputs)) {
    inputs = [inputs];
  }
  // find input entries
  const contents = lab.contents.filter((content) => content.type === 'input');
  if (contents.length !== inputs.length) {
    throw createError(400, 'The number of inputs did not match');
  }
  return contents.map((content, i) => {
    return {
      type: 'value',
      name: content.name,
      data: inputs[i],
    };
  });
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
