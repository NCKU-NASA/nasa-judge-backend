const axios = require('axios');
const judgeUrl = process.env.JUDGE_URL;

module.exports = {}

async function checkalive(timeout) {
    try {
      const resultalive = await axios.get(judgeUrl + "/alive", { timeout });
      return resultalive.data;
    } catch(err) {
      return false;
    }
}

['delete', 'get', 'head', 'options'].forEach(method => {
  /*eslint func-names:0*/
  module.exports[method] = async function(url, config) {
    const alive = await checkalive((config || {}).timeout || 5)
    if(!alive) return {alive};
    delete (config || {}).timeout;
    const result = await axios[method](url.replace(/^(.*:\/\/)?[^\/]*/, judgeUrl + "/"), config);
    result.alive = alive;
    return result;
  };
});

['post', 'put', 'patch'].forEach(method => {
  /*eslint func-names:0*/
  module.exports[method] = async function(url, data, config) {
    const alive = await checkalive((config || {}).timeout || 5)
    if(!alive) return {alive};
    delete (config || {}).timeout;
    const result = await axios[method](url.replace(/^(.*:\/\/)?[^\/]*/, judgeUrl + "/"), data, config);
    result.alive = alive;
    return result;
  };
});
