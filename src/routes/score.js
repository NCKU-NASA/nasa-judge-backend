const express = require('express');
const createError = require('http-errors');
const Score = require('../models/score');
const User = require('../models/user');
const Lab = require('../models/lab');
const auth = require('../middlewares/auth');
const router = express.Router();

router.get('/', auth.checkSignIn, async function(req, res, next) {
  try {
    const username = req.session.user.username;
    const userdata = await User.getUser({username});
    if(!userdata.groups.includes("admin")) throw createError(404);
    res.send(await Score.getResult(req.query));
  } catch(err) {
    next(err);
  }
});

router.get('/:labId', auth.checkSignIn, async function(req, res, next) {
  try {
    const lab = await Lab.getLab(req.params.labId);
    if (!lab) {
      throw createError(404);
    }
    const username = req.session.user.username;
    const score = await Score.getMaxLabScore(username, lab.id);
    const allscore = await Score.getResult({labId:lab.id})
    let maxscore = 0;
    for (var key in lab.checkpoints) {
      lab.checkpoints[key].forEach((result) => {
        maxscore += parseInt(result.weight);
      })
    }
    const allmaxscore = await Score.getResult({labId:lab.id, score:maxscore})
    const docount = Object.keys(allscore[lab.id]).length;
    const passcount = Object.keys(allmaxscore[lab.id]).length;
    if (!score) {
      res.send({ score: 0, docount, passcount });
    }
    else {
      res.send({ score, docount, passcount });
    }
  } catch(err) {
    next(err);
  }
});


module.exports = router;
