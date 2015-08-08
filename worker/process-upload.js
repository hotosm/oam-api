var Promise = require('es6-promise').Promise;

module.exports = function processUpload (upload) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve.bind(null, upload), 60000);
  });
};
