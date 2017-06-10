'use strict';

var config = require('../config');

// This is a place holder with a basic token authentication
// More advanced authentiction will be added later.
// TODO: Deprecate once user accounts have been implemented.

module.exports = function (token, callback) {
  var secretToken = config.tokenForPostRequests;

  if (token === secretToken) {
    callback(null, true, {token: token});
  } else {
    callback(null, false, { token: token });
  }
};
