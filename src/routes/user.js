const express = require('express');
const createError = require('http-errors');
const User = require('../models/user');
const Confirm = require('../models/confirm');
const judgeapi = require('../utils/judgeapi');
const token = require('../utils/token');
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

router.get('/', auth.checkSignIn, async function(req, res, next) {
  try {
    const userdata = await User.getUser({"username":req.session.user.username});
    var password = undefined;
    if(vncproxyUrl.includes(req.headers['x-forwarded-for'] || req.socket.remoteAddress)) 
      password = req.session.user.password;
    res.send({ username: userdata.username, studentId: userdata.studentId, password, ipindex: userdata.ipindex, isadmin: userdata.groups.includes('admin') });
  } catch(err) {
    next(err);
  }
})

async function loginsuccess(req, res, username, password) {
    req.session.user = {
      username,
      password,
    };
    
/*    const body = {
      username,
    };
    try
    {
        const result = await axios.post(vncproxyUrl + "/session", body);
        res.cookie('session', result.headers['set-cookie'][0].split(';')[0].replace("session=",""))
    }
    catch(err){}*/
}

router.post('/login', async function(req, res, next) {
  try {
    if(!req.body.username.toLowerCase()) throw createError(401, "username or password incorrect");
    const user = await User.getUser({"username": req.body.username.replaceAll(/[^0-9a-zA-Z]/ig, "").toLowerCase()});

    let nowlogin;
    if(req.session && req.session.user) nowlogin = await User.getUser({"username":req.session.user.username});
    if(!nowlogin || !nowlogin.groups.includes("admin")) {
      if(!req.body.password) throw createError(401, "username or password incorrect");
      const passwordhash = crypto.createHmac("sha256", secret).update(req.body.password).digest('base64');
      if (!user || passwordhash !== user.password) {
        throw createError(401, 'username or password incorrect');
      }
    }
    await loginsuccess(req, res, user.username, req.body.password);
    res.send('Login success');
  } catch(err) {
    next(err);
  }
});

router.post('/add', async function(req, res, next) {
  try {
    username = req.body.username.replaceAll(/[^0-9a-zA-Z]/ig, "").toLowerCase();
    studentId = req.body.studentId.replaceAll(/[^0-9a-zA-Z]/ig, "").toLowerCase();
    email = req.body.email.replaceAll(/[^0-9a-zA-Z@.]/ig, "").toLowerCase();
    if(!username || !req.body.password || !email) throw createError(401, "invalid input");
    let userdata = await User.getUser({username});
    if(userdata) throw createError(401, "user exist");
    if(studentId) {
      userdata = await User.getUser({studentId});
      if(userdata) throw createError(401, "studentId exist");
    }
    userdata = await User.getUser({email});
    if(userdata) throw createError(401, "email exist");
    emailpart = email.split("@");
    if(studentId != "" && (emailpart[0] != studentId || emailpart[1] != studentmaildomain)) throw createError(401, "invail email or studentId");
    const password = crypto.createHmac("sha256", secret).update(req.body.password).digest('base64');
    if(await Confirm.checkAddAccountConfirmExist(username, studentId, email)) throw createError(401, "Confirm exist. Please wait 5 min.");
    res.send(await Confirm.newAddAccountConfirm(username, password, studentId, email))
  } catch(err) {
    next(err);
  }
});

router.post('/token', auth.checkSignIn, async function(req, res, next) {
  try { 
    const username = req.session.user.username;
    const userdata = await User.getUser({username});
    if(!userdata) throw createError(404);
    const nowtoken = token.gettoken(userdata, req.body.data);
    res.send(nowtoken);
  } catch(err) {
    next(err);
  }
});

router.post('/forgetpasswd', async function(req, res, next) {
  try {
    email = req.body.email.replaceAll(/[^0-9a-zA-Z@.]/ig, "").toLowerCase();
    if(!email) throw createError(401, "invalid input");
    const userdata = await User.getUser({email});
    if(!userdata) throw createError(401, "email not exist");
    if(await Confirm.checkForgetPasswdConfirmExist(email)) throw createError(401, "Confirm exist. Please wait 5 min.");
    res.send(await Confirm.newForgetPasswdConfirm(email));
  } catch(err) {
    next(err);
  }
});

router.post('/chpasswd', async function(req, res, next) {
  try {
    if(!req.session || !req.session.user || !req.session.user.token) throw createError(401, "bad token");
    if(!req.body.password) throw createError(404, "invalid input");
    const confirmdata = await Confirm.popConfirm(req.session.user.token);
    if(!confirmdata || confirmdata.username) throw createError(401, "bad token");
    email = confirmdata.email.replaceAll(/[^0-9a-zA-Z@.]/ig, "").toLowerCase();
    const userdata = await User.getUser({email});
    const password = crypto.createHmac("sha256", secret).update(req.body.password).digest('base64');
    res.send(await User.changePasswd(userdata.username, password));
  } catch(err) {
    next(err);
  }
});

router.get('/checkcanchpasswd', async function(req, res, next) {
  try {
    if(!req.session || !req.session.user || !req.session.user.token) throw createError(401, "bad token");
    const confirmdata = await Confirm.popConfirm(req.session.user.token);
    if(!confirmdata || confirmdata.username) throw createError(401, "bad token");
    await Confirm.pushbackConfirm(confirmdata);
    res.send(true);
  } catch(err) {
    next(err);
  }
});

router.get('/confirm/:token', async function(req, res, next) {
  try {
    const confirmdata = await Confirm.popConfirm(req.params.token);
    if(confirmdata.username) {
      await User.addUser(confirmdata.username, confirmdata.password, confirmdata.studentId, confirmdata.email);
      //await loginsuccess(req, res, confirmdata.username);
      //res.redirect('/#/Lab');
      res.redirect('/');
    } else {
      await Confirm.pushbackConfirm(confirmdata);
      req.session.user = {
        token: req.params.token,
      };
      res.redirect('/#/Passwd');
    }
  } catch (err) {
    res.sendStatus(404);
  }
});

router.get('/config', async function(req, res, next) {
  try { 
    const username = req.query.username;
    const userdata = await User.getUser({username});
    if(!userdata) throw createError(404);
    if(!token.verifytoken(userdata, "userconfig", req.query.token)) throw createError(404);
    const result = await judgeapi.post('user/config', userdata, {
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
    const userdata = await User.getUser({username});
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
    const userdata = await User.getUser({username});
    if(!userdata) throw createError(404);
    if(!userdata.groups.includes("admin") && username !== req.body.username) throw createError(404);
    res.send(await User.getUser(req.body));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
