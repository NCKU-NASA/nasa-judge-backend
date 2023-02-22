const nodemailer = require('nodemailer');

const mailTransport = nodemailer.createTransport('SMTP', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWD,
  },
});

module.exports = mailTransport;
