const express = require('express');
const createError = require('http-errors');
const User = require('../models/user');
const judgeapi = require('../utils/judgeapi');
const path = require('path');
const auth = require('../middlewares/auth');
const axios = require('axios');
const crypto = require("crypto");
const fs = require('fs');
const router = express.Router();
const configFilename = 'wireguard.zip';
const vncproxyUrl = process.env.VNCPROXY_URL;
const secret = process.env.SECRET;

function createUserDir(username) {
  if (!username) {
    throw createError(400, 'Invalid username');
  }
  fs.mkdirSync(path.join(__dirname, `../files/${username}`), { recursive: true });
}

router.get('/', auth.checkSignIn, function(req, res, next) {
  try {
    res.send({ user: req.session.user.username });
  } catch(err) {
    next(err);
  }
})

router.post('/login', async function(req, res, next) {
  try {
    const user = await User.getUser(req.body.username);
    const passwordhash = crypto.createHmac("sha256", secret).update(req.body.password).digest('base64');
    if (!user || passwordhash !== user.password) {
      throw createError(401, 'StudentId or password incorrect');
    }
    req.session.user = {
      username: user.username,
    };
    
    const body = {
      username: user.username,
    };
    try
    {
        const result = await axios.post(vncproxyUrl + "/session", body);
        res.cookie('session', result.headers['set-cookie'][0].split(';')[0].replace("session=",""))
    }
    catch(err){}
    res.send('Login success');
    createUserDir(user.username);
  } catch(err) {
    next(err);
  }
});

router.post('/add', async function(req, res, next) {
  try {
    const passwordhash = crypto.createHmac("sha256", secret).update(req.body.password).digest('base64');
    res.send(await User.addUser(req.body.username, passwordhash, req.body.studentId))
  } catch(err) {
    next(err);
  }
});

router.get('/config', auth.checkSignIn, async function(req, res, next) {
  try { 
    const username = req.session.user.username;
    const userdata = await User.getUser(username);
    const result = await judgeapi.post('download/userconfig', userdata, {
        responseType: 'arraybuffer',
    });
    if(!result.alive) return;
    res.writeHead(200,{'Content-Disposition':result.headers['content-disposition'], 
                       'Content-Type':result.headers['content-type']});
    res.write(Buffer.from(result.data,'binary'),'binary');
    res.end(null, 'binary');
  } catch(err) {
      next(err);
  }
});

router.get('/alluserdata', auth.checkSignIn, async function(req, res, next) {
  const username = req.session.user.username;
  const userdata = User.getUser(username);
  if(!userdata.groups.includes("admin")) throw createError(404);
  res.send(User.getUsers())
});

router.post('/userdata', auth.checkSignIn, async function(req, res, next) {
  const username = req.session.user.username;
  const userdata = User.getUser(username);
  if(!userdata.groups.includes("admin")) throw createError(404);
  if(req.body.username) res.send(User.getUser(req.body.username));
  else if(req.body.ipindex) res.send(User.getUserbyipindex(req.body.ipindex));
});

module.exports = router;
