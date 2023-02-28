const judgeapi = require('../utils/judgeapi');

async function getLabs() {
  const result = await judgeapi.get("labs/getdata");
  if(!result.alive) return [];
  return result.data
}

async function getLab(labId) {
  const result = await judgeapi.get(`labs/${labId}/getdata`);
  if(!result.alive) return;
  return result.data
}

module.exports = {
  getLabs,
  getLab,
};
