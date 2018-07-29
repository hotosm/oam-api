var mongoose = require('mongoose');
const Boom = require('boom');
const User = require('../models/user');
const Meta = require('../models/meta');

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

function userImages (id) {
  let totalImages = [];
  return User.findOne({_id: id}).then(user => {
    if (!user) {
      const doesNotExistError = new Error('No Such User Found');
      throw doesNotExistError;
    } else {
      for (let i = 0; i < user.images.length; i++) {
        totalImages.push(user.images[i]);
      }
      let query = {$in: totalImages};
      return Meta.find({_id: query}).then(images => {
        if (!images) {
          const doesNotExistError = new Error('No Such Image Found');
          throw doesNotExistError;
        } else {
          return images;
        }
      });
    }
  })
  .catch(err => {
    return (Boom.badRequest(err.message));
  });
}

module.exports = {deleteUser, returnUsers, userImages};
