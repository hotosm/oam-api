'use strict';

var _ = require('lodash');
var Boom = require('boom');

var User = require('../models/user');

module.exports = [
  {
    method: 'GET',
    path: '/user',
    config: {
      auth: 'session',
      // TODO: add these globally for auth routes
      cors: {
        origin: ['*'],
        credentials: true
      }
    },
    handler: function (request, reply) {
      User.findOne({
        facebook_id: request.auth.credentials.facebook_id
      }).then(function (user) {
        // TODO: Add `.to_json()` to all API-expressable models.
        const response = _.pick(user, [
          'name',
          'contact_email',
          'profile_pic_uri',
          'images'
        ]);
        reply(response);
      }).catch(function (err) {
        reply(Boom.badImplementation(err));
      });
    }
  }
];
