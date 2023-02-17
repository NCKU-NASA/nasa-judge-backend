require('./utils/config').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const session = require('./middlewares/session');
const auth = require('./middlewares/auth');

const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const labsRouter = require('./routes/labs');
const judgeRouter = require('./routes/judge');
const checkapialiveRouter = require('./routes/checkapialive');

const app = express();

app.set('trust proxy', 1);
app.use(session);
app.use(auth.addMeta);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/labs', labsRouter);
app.use('/judge', judgeRouter);
app.use('/checkapialive', checkapialiveRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.error('ERROR: ' + err.message);
  res.sendStatus(err.status || 500);
});

module.exports = app;
