var Boom = require('boom');

module.exports = {
  isOwnerOfRequestedObject: function (request, reply) {
    console.log(typeof request.auth.credentials._id);
    console.log(typeof request.app.requestedObject.user);
    if (request.auth.credentials._id.toString() !== request.app.requestedObject.user.toString()) {
      reply(Boom.forbidden('Authenticated user does not have permission.'));
      return;
    }
    reply();
  }
};
