/**
 * Given a connection to the db, create a token validator function
 * @param {Object} db A connection to the database
 * @return {Function} A validation function that takes (token, callback) and calls the callback with (error, isValid, credentialsObject)
 */
module.exports = function (db) {
  return function (req, session, callback) {
    if (session.username === process.env.ADMIN_USERNAME) {
      return callback(null, true, session);
    } else {
      // Session no longer valid
      return callback(null, false);
    }
  };
};
