const express = require('express');
const Lab = require('../models/lab');
const User = require('../models/user');
const judgeapi = require('../utils/judgeapi');
const createError = require('http-errors');
const fs = require('fs');
const path = require('path');
const auth = require('../middlewares/auth');
const router = express.Router();

router.get('/', auth.checkSignIn, async function(req, res, next) {
  try {
    const username = req.session.user.username;
    const userdata = await User.getUser(username);
    if(!userdata) { 
      res.send({ labs: [] });
      return;
    }
    const labs = await Lab.getLabs();
    for(var i = 0; i < labs.length; i++) {
      let allow = labs[i].promissions.includes("all");
      if(!allow) {
        userdata.groups.forEach(function(group) {
          if(labs[i].promissions.includes(group)) {
              allow = true;
          }
        });
        if(!allow) {
          labs.splice(i,1);
          i--;
        }
      }
    }
    res.send({ labs });
  } catch(err) {
    next(err);
  }
});

//router.use('/public', auth.checkSignIn, express.static(path.join(__dirname, '../files/public')));
router.get('/:labId/download/description', auth.checkSignIn, async function(req, res, next) {
  try { 
    const username = req.session.user.username;
    const userdata = await User.getUser(username);
    if(!userdata) throw createError(404);
    const lab = await Lab.getLab(req.params.labId);
    if(!lab) throw createError(404);
    let allow = lab.promissions.includes("all");
    userdata.groups.forEach(function(group) {
      if(lab.promissions.includes(group)) {
          allow = true;
      }
    });
    if(!allow) throw createError(404);
    const result = await judgeapi.get(`/download/${req.params.labId}/description`, {
        responseType: 'arraybuffer',
    });
    if(!result.alive) return;
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

router.get('/:labId/download/:filename', auth.checkSignIn, async function(req, res, next) {
  try { 
    const username = req.session.user.username;
    const userdata = await User.getUser(username);
    if(!userdata) throw createError(404);
    const lab = await Lab.getLab(req.params.labId);
    if(!lab) throw createError(404);
    let allow = lab.promissions.includes("all");
    userdata.groups.forEach(function(group) {
      if(lab.promissions.includes(group)) {
          allow = true;
      }
    });
    if(!allow) throw createError(404);
    const contents = lab.contents.filter((content) => content.type === 'download' && content.name === req.params.filename);
    if(contents.length !== 1) return;
    let path;
    if(contents[0].useusername) path = `download/${req.params.labId}/${username}/${req.params.filename}`
    else path = `download/${req.params.labId}/${req.params.filename}`

    const result = await judgeapi.get(path, {
        responseType: 'arraybuffer',
    });
    if(!result.alive) return;
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

module.exports = router;
