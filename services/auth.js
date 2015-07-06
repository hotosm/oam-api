'use strict';

// This is a place holder with a basic token authentication
// More advanced authentiction will be added later

module.exports = function (token, callback) {
  var secretToken = process.env.SECRET_TOKEN || 'insecuretoken';

  if (token === secretToken) {
    callback(null, true, {token: token});
  } else {
    callback(null, false, { token: token });
  }
};
