const express = require('express');
const createError = require('http-errors');
const User = require('../models/user');
const Confirm = require('../models/confirm');
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
const studentmaildomain = process.env.STUDENT_EMAIL_DOMAIN;

router.get('/', auth.checkSignIn, function(req, res, next) {
  try {
    res.send({ user: req.session.user.username });
  } catch(err) {
    next(err);
  }
})

router.post('/login', async function(req, res, next) {
  try {
    const user = await User.getUser(req.body.username.toLowerCase());
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
  } catch(err) {
    next(err);
  }
});

router.post('/add', async function(req, res, next) {
  try {
    username = req.body.username.replace(/[^0-9a-zA-Z.@_]/, "").toLowerCase();
    studentId = req.body.studentId.replace(/[^0-9a-zA-Z.@_]/, "").toLowerCase();
    email = req.body.email.replace(/[^0-9a-zA-Z.@_]/, "").toLowerCase();
    if(!username || !req.body.password || !email) throw createError(401, "invalid input");
    const userdata = await User.getUser(username);
    if(userdata) throw createError(401, "user exist");
    emailpart = email.split("@");
    if(emailpart[0] != "" && (emailpart[0] != studentId || emailpart[1] != studentmaildomain)) throw createError(401, "invail email or studentId");
    const password = crypto.createHmac("sha256", secret).update(req.body.password).digest('base64');
    if(await Confirm.checkConfirmExist(username, studentId, email)) throw createError(401, "Confirm exist. Please wait 5 min.");
    res.send(await Confirm.newConfirm(username, password, studentId, email))
  } catch(err) {
    next(err);
  }
});

router.get('/confirm/:token', async function(req, res, next) {
  try {
    const confirmdata = await Confirm.popConfirm(req.params.token);
    await User.addUser(confirmdata.username, confirmdata.password, confirmdata.studentId, confirmdata.email);
    res.redirect('/');
  } catch (err) {
    res.sendStatus(404);
  }
});

router.get('/config', auth.checkSignIn, async function(req, res, next) {
  try { 
    const username = req.session.user.username;
    const userdata = await User.getUser(username);
    if(!userdata) throw createError(404);
    const result = await judgeapi.post('download/userconfig', userdata, {
        responseType: 'arraybuffer',
    });
    if(!result.alive) throw createError(404);
    res.writeHead(200,{'Content-Disposition':result.headers['content-disposition'], 
                       'Content-Type':result.headers['content-type']});
    res.write(Buffer.from(result.data,'binary'),'binary');
    res.end(null, 'binary');
  } catch(err) {
    if(err && err.response && err.response.status && err.response.status == 404){
      res.sendStatus(404);
    } else {
      next(err);
    }
  }
});

router.get('/alluserdata', auth.checkSignIn, async function(req, res, next) {
  try {
    const username = req.session.user.username;
    const userdata = await User.getUser(username);
    if(!userdata) throw createError(404);
    if(!userdata.groups.includes("admin")) throw createError(404);
    res.send(await User.getUsers())
  } catch (err) {
    next(err);
  }
});

router.post('/userdata', auth.checkSignIn, async function(req, res, next) {
  try {
    const username = req.session.user.username;
    const userdata = await User.getUser(username);
    if(!userdata) throw createError(404);
    if(!userdata.groups.includes("admin")) throw createError(404);
    if(req.body.username) res.send(await User.getUser(req.body.username));
    else if(req.body.ipindex) res.send(await User.getUserbyipindex(req.body.ipindex));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
