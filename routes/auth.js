'use strict';

var Boom = require('boom');
var User = require('../models/user');

function oauthHandler (request, reply) {
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

module.exports = [
  {
    method: ['GET', 'POST'],
    path: '/oauth/facebook',
    config: {
      auth: 'facebook',
      handler: oauthHandler
    }
  },

  {
    method: ['GET', 'POST'],
    path: '/oauth/google',
    config: {
      auth: 'google',
      handler: oauthHandler
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
