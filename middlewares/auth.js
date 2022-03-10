const createError = require('http-errors');

function checkSignIn(req, res, next) {
  if (req.isSignIn === true) {
    next();
  } else {
    next(createError(401));
  }
}

function addMeta(req, res, next) {
  if (req.session && req.session.user) {
    req.isSignIn = true;
  } else {
    req.isSignIn = false;
  }
  next();
}

module.exports = {
  checkSignIn,
  addMeta,
}