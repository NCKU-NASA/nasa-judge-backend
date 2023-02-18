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
  module.exports[method] = function(url, config) {
    return new Promise((resolve, reject) => {
      checkalive((config || {}).timeout || 5000).then((alive) => {
        if(!alive) return {alive};
        delete (config || {}).timeout;
        axios[method](judgeUrl + "/" + url.replace(/^((.*:\/\/)[^\/]*)?\/?/, ""), config).then((result) => {
          result.alive = alive;
          resolve(result);
        }, (error) => {
            reject(error);
        });
      }, (error) => {
        reject(error);
      });
    });
  };
});

['post', 'put', 'patch'].forEach(method => {
  /*eslint func-names:0*/
  module.exports[method] = function(url, data, config) {
    return new Promise((resolve, reject) => {
      checkalive((config || {}).timeout || 5000).then((alive) => {
        if(!alive) return {alive};
        delete (config || {}).timeout;
        axios[method](judgeUrl + "/" + url.replace(/^((.*:\/\/)[^\/]*)?\/?/, ""), data, config).then((result) => {
          result.alive = alive;
          resolve(result);
        }, (error) => {
            reject(error);
        });
      }, (error) => {
        reject(error);
      });
    });
  };
});
