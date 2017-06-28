'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/user',
    config: {
      auth: 'session'
    },
    handler: function (request, reply) {
      reply(request.auth.credentials);
    }
  }
];
