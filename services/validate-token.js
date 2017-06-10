var db = require('mongoose').connection;

/**
 * Given a connection to the db, create a token validator function
 * @param {Object} db A connection to the database
 * @return {Function} A validation function that takes (token, callback) and calls the callback with (error, isValid, credentialsObject)
 */
module.exports = function () {
  return function (token, callback) {
    db.collection('tokens').findOne({
      token: token,
      status: 'active'
    })
    .then(function (activeToken) {
      if (!activeToken) { return callback(null, false, {token: token}); }

      var expired = false;
      if (activeToken.expiration) {
        var exp = new Date(activeToken.expiration);
        var now = new Date();
        expired = exp < now;
      }

      // routes expect an 'id' property on the credentials object
      activeToken.id = activeToken._id;
      callback(null, !expired, activeToken);
    })
    .catch(callback);
  };
};
