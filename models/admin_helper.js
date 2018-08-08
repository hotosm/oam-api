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

function filterByUserName (name) {
  return User.findOne({name: name}).then(user => {
    if (!user) {
      const doesNotExistError = new Error('No Such User Found');
      throw doesNotExistError;
    } else {
      let query = {$in: user.images};
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

function filterByDate (day, month, year) {
  return Meta.find({uploaded_at: {$gte: new Date(Date.UTC(year, month - 1, day))}}).then(images => {
    if (!images) {
      const doesNotExistError = new Error('No Image Found');
      throw doesNotExistError;
    } else {
      return images;
    }
  })
  .catch(err => {
    return (Boom.badRequest(err.message));
  });
}

function filterByPlatform (platform) {
  return Meta.find({ platform: platform }).then(images => {
    if (!images) {
      const doesNotExistError = new Error('No Image Found');
      throw doesNotExistError;
    } else {
      return images;
    }
  })
  .catch(err => {
    return (Boom.badRequest(err.message));
  });
}

function filterByLetter (alphabet) {
  return Meta.find({title: {$regex: '^' + alphabet, $options: 'i'}}).then(images => {
    if (!images) {
      const doesNotExistError = new Error('No Image Found');
      throw doesNotExistError;
    } else {
      return images;
    }
  })
  .catch(err => {
    return (Boom.badRequest(err.message));
  });
}

function deleteImage (id) {
  return Meta.findOneAndRemove({_id: id}).then(imageDeleted => {
    if (!imageDeleted) {
      const doesNotExistError = new Error('No Such Image Found');
      throw doesNotExistError;
    } else {
      User.find({}).then(users => {
        if (!users) {
          return imageDeleted;
        } else {
          users.forEach(function (user) {
            const index = user.images.indexOf(imageDeleted._id);
            if (index !== -1) {
              user.images.splice(index, 1);
              user.save();
            }
          });
        }
      });
      return imageDeleted;
    }
  })
  .catch(err => {
    return (Boom.badRequest(err.message));
  });
}

module.exports = {deleteUser, returnUsers, filterByDate, filterByPlatform, filterByLetter, deleteImage, filterByUserName};
