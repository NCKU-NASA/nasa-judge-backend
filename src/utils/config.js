require('dotenv').config();

const requiredVars = [
  'DB_NAME',
  'DB_USER',
  'DB_PASSWD',
  'SECRET',
  'JUDGE_URL',
];
const lackVars = [];

Date.prototype.toISOZoneString = function () {
  let pad =(n)=>(n < 10)?'0' + n:n;
  let hours_offset = this.getTimezoneOffset() / 60;
  let offset_date = this.setHours(this.getHours() - hours_offset);
  let symbol = (hours_offset >= 0) ? "-" : "+";
  let time_zone = symbol+pad(Math.abs(hours_offset))+ ":00";
  
  return this.getUTCFullYear() +
    '-' + pad(this.getUTCMonth() + 1) +
    '-' + pad(this.getUTCDate()) +
    ' ' + pad(this.getUTCHours()) +
    ':' + pad(this.getUTCMinutes()) +
    ':' + pad(this.getUTCSeconds());
};

function config() {
  requiredVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      lackVars.push(envVar);
    }
  });
  if (lackVars.length !== 0) {
    console.error(`ERROR: Environment variables ${lackVars.join(', ')} not set.`);
    process.exit(1);
  }
}

module.exports = {
  config
};
