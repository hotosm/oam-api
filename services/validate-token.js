/**
 * Given a connection to the db, create a token validator function
 * @param {Object} db A connection to the database
 * @return {Function} A validation function that takes (token, callback) and calls the callback with (error, isValid, credentialsObject)
 */
module.exports = function (db) {
  return function (token, callback) {
    // TODO: replace the following with real auth (hit the db, etc.)
    if (token === 'usertoken') {
      // successful authentication
      callback(null, true, {
        user: {
          id: 1, // <- can be anything as long as it's unique; used for associations w uploads
          name: 'Some Body'
        },
        token: token
      });
    } else {
      // bad token
      callback(null, false, { token: token });
    }
  };
};
