const express = require('express');
const createError = require('http-errors');
const Score = require('../models/score');
const User = require('../models/user');
const Lab = require('../models/lab');
const auth = require('../middlewares/auth');
const router = express.Router();

router.post('/', auth.checkSignIn, async function(req, res, next) {
  const username = req.session.user.username;
  const userdata = await User.getUser(username);
  if(!userdata.groups.includes("admin")) throw createError(404);
  res.send(Score.getResult(req.body.username, req.body.labId, req.body.usedeadline));
});

router.get('/:labId', auth.checkSignIn, async function(req, res, next) {
  try {
    const lab = await Lab.getLab(req.params.labId);
    if (!lab) {
      throw createError(404);
    }
    const username = req.session.user.username;
    const score = await Score.getMaxLabScore(username, lab.id);
    if (!score) {
      res.send({ score: 0 });
    }
    else {
      res.send({ score });
    }
  } catch(err) {
    next(err);
  }
});


module.exports = router;
