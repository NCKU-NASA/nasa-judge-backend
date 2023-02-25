const axios = require('axios');
const judgeUrl = process.env.JUDGE_URL;

module.exports = {}

function checkalive(timeout) {
  return new Promise((resolve, reject) => {
    try {
      axios.get(judgeUrl + "/alive", { timeout }).then((resultalive) => {
        resolve(resultalive.data);
      }, (error) => {
        resolve(false);
      });
    } catch(err) {
      resolve(false);
    }
  });
}

['delete', 'get', 'head', 'options'].forEach(method => {
  /*eslint func-names:0*/
  module.exports[method] = async function(url, config) {
    const alive = await checkalive((config || {}).timeout || 5000);
    if(!alive) return {alive};
    delete (config || {}).timeout;
    const result = await axios[method](judgeUrl + "/" + url.replace(/^((.*:\/\/)[^\/]*)?\/?/, ""), config);
    result.alive = alive;
    return result
  };
});

['post', 'put', 'patch'].forEach(method => {
  /*eslint func-names:0*/
  module.exports[method] = async function(url, data, config) {
    const alive = await checkalive((config || {}).timeout || 5000);
    if(!alive) return {alive};
    delete (config || {}).timeout;
    const result = await axios[method](judgeUrl + "/" + url.replace(/^((.*:\/\/)[^\/]*)?\/?/, ""), data, config);
    result.alive = alive;
    return result;
  };
});
