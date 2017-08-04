var Boom = require('boom');

module.exports = {
  isOwnerOfRequestedObject: function (request, reply) {
    if (request.auth.credentials._id.toString() !== request.app.requestedObject.user.toString()) {
      reply(Boom.forbidden('Authenticated user does not have permission.'));
      return;
    }
    reply();
  }
};
