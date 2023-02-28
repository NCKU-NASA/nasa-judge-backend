var express = require('express');
const judgeapi = require('../utils/judgeapi');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.status(200).send('Welcome to NASA course');
});

router.get('/pubkey', async function(req, res, next) {
  try { 
    const result = await judgeapi.get(`/pubkey`);
    if(!result.alive) throw createError(404);
    res.send(result.data);
  } catch(err) {
    if(err && err.response && err.response.status && err.response.status == 404){
      res.sendStatus(404);
    } else {
      next(err);
    }
  }
});

module.exports = router;
