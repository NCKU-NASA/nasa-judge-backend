const express = require('express');
const createError = require('http-errors');
const auth = require('../middlewares/auth');
const router = express.Router();
const vncproxyUrl = process.env.VNCPROXY_URL;
//const secret = process.env.SECRET;

router.get('/get', auth.checkSignIn, async function(req, res, next) {
  try { 
    if(vncproxyUrl.includes(req.headers['x-forwarded-for'] || req.socket.remoteAddress)) {
      res.send(req.session);
    }
    else throw createError(404);
  } catch(err) {
    next(err);
  }
})

router.post('/set', auth.checkSignIn, async function(req, res, next) {
  try { 
    if(vncproxyUrl.includes(req.headers['x-forwarded-for'] || req.socket.remoteAddress)) {
      for (var key in req.body) {
        if(key !== "cookie") {
            req.session[key] = req.body[key];
        }
      }
      res.send(true);
    }
    else throw createError(404);
  } catch(err) {
    next(err);
  }
})

module.exports = router;
