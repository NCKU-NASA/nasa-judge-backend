const mysql = require('mysql');
const connection = mysql.createConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWD,
  database: process.env.DB_NAME,
});
 
connection.connect((err) => {
  if (err) {
    console.error('Error connecting: ' + err.stack);
    process.exit(1);
  } 
});

module.exports = connection;
