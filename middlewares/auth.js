const createError = require('http-errors');
const axios = require('axios');
const vncproxyUrl = process.env.VNCPROXY_URL;

function checkSignIn(req, res, next) {
  if (req.isSignIn === true) {
    next();
  } else {
    next(createError(401));
  }
}

async function addMeta(req, res, next) {
  if (req.session && req.session.user) {
    header = {};
    if (req.headers.cookie.includes('session'))
    {
      nowsession = req.headers.cookie.split('session=')[1];
      if(nowsession.includes('; '))
      {
        nowsession = nowsession.split('; ')[0];
      }
      header = {
        headers: {
          'Cookie': 'session=' + nowsession + '; '
        }
      };
    }
    const body = {
      username: req.session.user.studentId,
    };
    const result = await axios.post(vncproxyUrl + "/session", body, header);
    res.cookie('session', result.headers['set-cookie'][0].split(';')[0].replace("session=",""));
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
