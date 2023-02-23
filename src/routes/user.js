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

async function loginsuccess(req, res, username) {
    req.session.user = {
      username,
    };
    
    const body = {
      username,
    };
    try
    {
        const result = await axios.post(vncproxyUrl + "/session", body);
        res.cookie('session', result.headers['set-cookie'][0].split(';')[0].replace("session=",""))
    }
    catch(err){}
}

router.post('/login', async function(req, res, next) {
  try {
    if(!req.body.username.toLowerCase() || !req.body.password) throw createError(401, "username or password incorrect");
    const user = await User.getUser(req.body.username.replaceAll(/[^0-9a-zA-Z.@_]/ig, "").toLowerCase());
    const passwordhash = crypto.createHmac("sha256", secret).update(req.body.password).digest('base64');
    if (!user || passwordhash !== user.password) {
      throw createError(401, 'username or password incorrect');
    }
    await loginsuccess(req, res, user.username);
    res.send('Login success');
  } catch(err) {
    next(err);
  }
});

router.post('/add', async function(req, res, next) {
  try {
    username = req.body.username.replaceAll(/[^0-9a-zA-Z.@_]/ig, "").toLowerCase();
    studentId = req.body.studentId.replaceAll(/[^0-9a-zA-Z.@_]/ig, "").toLowerCase();
    email = req.body.email.replaceAll(/[^0-9a-zA-Z.@_]/ig, "").toLowerCase();
    if(!username || !req.body.password || !email) throw createError(401, "invalid input");
    let userdata = await User.getUser(username);
    if(userdata) throw createError(401, "user exist");
    userdata = await User.getUserbyStudentId(studentId);
    if(userdata) throw createError(401, "studentId exist");
    userdata = await User.getUserbyEmail(email);
    if(userdata) throw createError(401, "email exist");
    emailpart = email.split("@");
    if(studentId != "" && (emailpart[0] != studentId || emailpart[1] != studentmaildomain)) throw createError(401, "invail email or studentId");
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
    await loginsuccess(req, res, confirmdata.username);
    res.redirect('/#/Lab');
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
