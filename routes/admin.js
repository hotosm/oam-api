'use strict';

const Joi = require('joi');
const Boom = require('boom');
const verifyCredentials = require('../models/verifyCredentials');
const createToken = require('../models/createToken');
const {deleteUser, returnUsers, filterByUserName, filterByDate, filterByPlatform, filterByLetter, deleteImage} = require('../models/admin_helper');

module.exports = [
  {
    method: 'GET',
    path: '/admin',
    config: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      },
      handler: function (request, reply) {
        reply('Authorized request');
      }
    }
  },
  {
    method: 'POST',
    path: '/createToken',
    config: {
      auth: false,
      validate: {
        payload: {
          email: Joi.string().email().required(),
          password: Joi.string().min(3).max(30).required()
        }
      },
      handler: function (request, reply) {
        const email = request.payload.email;
        const password = request.payload.password;
        return verifyCredentials(email, password)
          .then(verified => {
            return createToken(email, 'admin').then((token) => {
              reply({ token: token }).code(201);
            });
          })
          .catch((error) => {
            reply(Boom.badRequest(error.message));
          });
      },
      tags: ['disablePlugins']
    }
  },
  {
    method: 'GET',
    path: '/users',
    config: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      },
      handler: function (request, reply) {
        reply(returnUsers());
      }
    }
  },
  {
    method: 'DELETE',
    path: '/users/{id}',
    config: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      },
      handler: function (request, reply) {
        reply(deleteUser(request.params.id));
      }
    }
  },
  {
    method: 'GET',
    path: '/images/user/{name}',
    config: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      },
      handler: function (request, reply) {
        reply(filterByUserName(request.params.name));
      }
    }
  },
  {
    method: 'GET',
    path: '/images/date/{day}/{month}/{year}',
    config: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      },
      handler: function (request, reply) {
        reply(filterByDate(request.params.day, request.params.month, request.params.year));
      }
    }
  },
  {
    method: 'GET',
    path: '/images/platform/{platform}',
    config: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      },
      handler: function (request, reply) {
        reply(filterByPlatform(request.params.platform));
      }
    }
  },
  {
    method: 'GET',
    path: '/images/alphabet/{alphabet}',
    config: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      },
      handler: function (request, reply) {
        reply(filterByLetter(request.params.alphabet));
      }
    }
  },
  {
    method: 'DELETE',
    path: '/image/{id}',
    config: {
      auth: {
        strategy: 'jwt',
        scope: ['admin']
      },
      handler: function (request, reply) {
        reply(deleteImage(request.params.id));
      }
    }
  }
];
