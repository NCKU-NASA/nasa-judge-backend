const express = require('express');
const Lab = require('../models/lab');
const Score = require('../models/score');
const User = require('../models/user');
const token = require('../utils/token');
const judgeapi = require('../utils/judgeapi');
const createError = require('http-errors');
const fs = require('fs');
const path = require('path');
const auth = require('../middlewares/auth');
const router = express.Router();
const Chart = require('chart.js');
const { createCanvas } = require('canvas');


router.get('/', auth.checkSignIn, async function(req, res, next) {
  try {
    const username = req.session.user.username;
    const userdata = await User.getUser({username});
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
router.get('/:labId/download/description', async function(req, res, next) {
  try { 
    const username = req.query.username;
    const userdata = await User.getUser({username});
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
    if(!token.verifytoken(userdata, `${req.params.labId}/description`, req.query.token)) throw createError(404);
    const result = await judgeapi.get(`labs/${req.params.labId}/file/description`, {
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

router.get('/:labId/download/:filename', async function(req, res, next) {
  try { 
    const username = req.query.username;
    const userdata = await User.getUser({username});
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
    if(!token.verifytoken(userdata, `${req.params.labId}/${req.params.filename}`, req.query.token)) throw createError(404);
    const contents = lab.contents.filter((content) => content.type === 'download' && content.name === req.params.filename);
    if(contents.length !== 1) throw createError(404);
    let path;
    if(contents[0].useusername) path = `labs/${req.params.labId}/file/${username}/${req.params.filename}`
    else path = `labs/${req.params.labId}/file/${req.params.filename}`

    const result = await judgeapi.get(path, {
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

router.get('/:labId/chart', auth.checkSignIn, async function(req, res, next) {
  try { 
    const lab = await Lab.getLab(req.params.labId);
    if(!lab) throw createError(404);
    const canvas = createCanvas(600, 400);

    const ctx = canvas.getContext('2d');
    
    const allscore = await Score.getResult({labId:req.params.labId})
    var analytics = {}
    for(var key in allscore[req.params.labId]) {
      analytics[allscore[req.params.labId][key]['score']]=analytics[allscore[req.params.labId][key]['score']]?analytics[allscore[req.params.labId][key]['score']]+1:1
    }
      
    const data = {
      labels: Object.keys(analytics),
      datasets: [{
        label: 'of users',
        data: Object.values(analytics),
        borderWidth: 1
      }]
    };

    const options = {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    };

    const chart = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: options
    })
    res.send(await new Promise((resolve, reject) => {
      chart.canvas.toDataURL('image/png', (err, png) => {
        if(err) reject(err);
        else resolve(png);
      });
    }));

  } catch(err) {
    if(err && err.response && err.response.status && err.response.status == 404){
      res.sendStatus(404);
    } else {
      next(err);
    }
  }
});

module.exports = router;
