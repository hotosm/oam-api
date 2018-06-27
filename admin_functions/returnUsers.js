const Boom = require('boom');
const User = require('../models/user');

function returnUsers () {
  return User.find({}).then(users => {
    if (!users) {
      const doesNotExistError = new Error('No User Found');
      throw doesNotExistError;
    } else {
      return users;
    }
  })
  .catch(err => {
    return (Boom.badRequest(err.message));
  });
}

module.exports = returnUsers;
