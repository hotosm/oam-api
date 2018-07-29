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
function deleteUser (id) {
  return User.findOneAndRemove({_id: id}).then(userDeleted => {
    if (!userDeleted) {
      const doesNotExistError = new Error('No Such User Found');
      throw doesNotExistError;
    } else {
      return userDeleted;
    }
  })
  .catch(err => {
    return (Boom.badRequest(err.message));
  });
}

module.exports = {deleteUser, returnUsers};
