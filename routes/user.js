'use strict';

var Boom = require('boom');
var config = require('../config');

module.exports = [
  {
    method: ['GET', 'POST'],
    path: '/login',
    config: {
      auth: {mode: 'try', strategy: 'session'}
    },
    handler: function (request, reply) {
      if (request.auth.isAuthenticated) {
        return reply({
          statusCode: 200,
          message: 'Welcome back'
        });
      }

      if (!config.adminUsername || !config.adminPassword) {
        return reply(Boom.badImplementation('Admin username and password are not configured'));
      }

      if (request.method === 'post') {
        var username = request.payload.username;
        var password = request.payload.password;

        if (!username || !password) {
          return reply({
            statusCode: 400,
            message: 'Missing username and/or password'
          }).code(400);
        }

        if (username !== config.adminUsername || password !== config.adminPassword) {
          return reply({
            statusCode: 401,
            message: 'Invalid username and/or password'
          }).code(401);
        }

        request.auth.session.set({
          username: username
        });

        return reply({
          statusCode: 200,
          message: 'User logged'
        });
      } else {
        return reply({
          statusCode: 401,
          message: 'User not logged'
        }).code(401);
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
      request.auth.session.clear();
      return reply({
        code: 200,
        message: 'Goodbye!'
      });
    }
  }
];
