require('dotenv').config();

const requiredVars = [
  'DB_NAME',
  'DB_USER',
  'DB_PASSWD',
  'SECRET',
  'JUDGE_URL',
];
const lackVars = [];

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
