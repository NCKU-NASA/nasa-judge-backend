const express = require('express');
const createError = require('http-errors');
const Score = require('../models/score');
const Lab = require('../models/lab');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const auth = require('../middlewares/auth');
const router = express.Router();
const judgeUrl = process.env.JUDGE_URL;

router.get('/', auth.checkSignIn, async function(req, res, next) {
  try {
    // send request to judge server
    const result = await axios.get(judgeUrl + "/alive", {
        timeout: 5000
    });
    res.send(result.data);

  } catch(err) {
    next(err);
  }
});


module.exports = router;
