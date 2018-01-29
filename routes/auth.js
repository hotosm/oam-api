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

function jwtHandler (request, reply) {
  User.jwtLogin(request.auth.credentials).then((token) => {
    const messageResponse = `<html><script type="text/javascript">window.opener.postMessage({"token": "${token}"}, '*');window.close();</script></html>`;
    const response = reply(messageResponse).type('text/html');
    return response;
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
    path: '/oauth/jwtfacebook',
    config: {
      auth: 'facebook',
      handler: jwtHandler,
      tags: ['disablePlugins']
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
