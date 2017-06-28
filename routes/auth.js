'use strict';

var Boom = require('boom');
var User = require('../models/user');

module.exports = [
  {
    method: ['GET', 'POST'],
    path: '/login',
    config: {
      auth: 'facebook',
      handler: function (request, reply) {
        if (!request.auth.isAuthenticated) {
          reply('Authentication failed due to: ' + request.auth.error.message);
          return;
        }

        User.login(request.auth.credentials, function (err, sessionId) {
          if (err) {
            reply(Boom.badImplementation(err));
            return;
          }
          request.cookieAuth.set({ sessionId: sessionId });
          reply.redirect(request.auth.credentials.query.original_uri || '/');
        });
      }
    }
  },

  {
    method: 'GET',
    path: '/logout',
    config: {
      auth: 'session'
    },
    handler: function (request, reply) {
      request.cookieAuth.clear();
      reply({
        code: 200,
        message: 'Goodbye!'
      });
    }
  }
];
