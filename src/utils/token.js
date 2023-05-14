const crypto = require("crypto");
const secret = process.env.SECRET;

function gettoken(user, data) {
  return crypto.createHmac("sha256", secret).update(user.username).update(user.password).update(data).update(new Date().getUTCFullYear().toString()).update(new Date().getUTCMonth().toString()).update(new Date().getUTCDate().toString()).digest('base64');
}

function verifytoken(user, data, token) {
  return token === gettoken(user, data);
}

module.exports = {
  gettoken,
  verifytoken,
}
