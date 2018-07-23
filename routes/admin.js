'use strict';

const Joi = require('joi');
const Boom = require('boom');
const verifyCredentials = require('../models/verifyCredentials');
const createToken = require('../models/createToken');
const User = require('../models/user');

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
  }
];
