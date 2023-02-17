const session = require('express-session');
const Store = require('express-mysql-session')(session);

const options = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWD,
  database: process.env.DB_NAME,
};

module.exports = session({
  store: new Store(options),
  secret: process.env.SECRET,
  resave: true,
  saveUninitialized: false,
  rolling: true,
  cookie: { maxAge: 82800000 },
});