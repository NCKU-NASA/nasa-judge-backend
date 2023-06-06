const createError = require('http-errors');
const axios = require('axios');
//const vncproxyUrl = process.env.VNCPROXY_URL;

function checkSignIn(req, res, next) {
  if (req.isSignIn === true) {
    next();
  } else {
    next(createError(401));
  }
}

async function addMeta(req, res, next) {
  if (req.session && req.session.user && req.session.user.username) {
    req.isSignIn = true;
  } else {
    res.clearCookie('session')
    req.isSignIn = false;
  }
  next();
}

module.exports = {
  checkSignIn,
  addMeta,
}
