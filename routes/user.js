const express = require('express');
const createError = require('http-errors');
const User = require('../models/user');
const path = require('path');
const auth = require('../middlewares/auth');
const axios = require('axios');
const crypto = require("crypto");
const fs = require('fs');
const router = express.Router();
const configFilename = 'wireguard.zip';
const vncproxyUrl = process.env.VNCPROXY_URL;

function createUserDir(studentId) {
  if (!studentId) {
    throw createError(400, 'Invalid studentId');
  }
  fs.mkdirSync(path.join(__dirname, `../files/${studentId}`), { recursive: true });
}

router.get('/', auth.checkSignIn, function(req, res, next) {
  try {
    res.send({ user: req.session.user.studentId });
  } catch(err) {
    next(err);
  }
})

router.post('/login', async function(req, res, next) {
  try {
    const user = await User.getUser(req.body.studentId);
    const passwordhash = crypto.createHash("sha256").update(req.body.password).digest('base64');
    if (!user || passwordhash !== user.password) {
      throw createError(401, 'StudentId or password incorrect');
    }
    req.session.user = {
      studentId: user.studentId,
    };
    
    const body = {
      username: user.studentId,
    };
    try
    {
        const result = await axios.post(vncproxyUrl + "/session", body);
        res.cookie('session', result.headers['set-cookie'][0].split(';')[0].replace("session=",""))
    }
    catch(err){}
    res.send('Login success');
    createUserDir(user.studentId);
  } catch(err) {
    next(err);
  }
});

router.get('/config', auth.checkSignIn, async function(req, res, next) {
  res.sendFile(path.join(__dirname, `../files/${ req.session.user.studentId }/${ configFilename }`));
});

module.exports = router;
