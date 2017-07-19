'use strict';

var _ = require('lodash');
var Boom = require('boom');

var User = require('../models/user');
var Meta = require('../models/meta');

module.exports = [
  {
    method: 'GET',
    path: '/user',
    config: {
      auth: 'session'
    },
    handler: function (request, reply) {
      User.findOne({
        facebook_id: request.auth.credentials.facebook_id
      }).then(function (user) {
        // TODO: Add `.to_json()` to all API-expressable models.
        return _.pick(user, [
          '_id',
          'name',
          'contact_email',
          'profile_pic_uri'
        ]);
      }).then(function (user) {
        Meta.find({user: user._id}).then(function (images) {
          user.images = images;
          reply(user);
        });
      }).catch(function (err) {
        reply(Boom.badImplementation(err));
      });
    }
  }
];
