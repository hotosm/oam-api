'use strict';

var _ = require('lodash');
var Boom = require('boom');
var Joi = require('joi');

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
        session_id: request.auth.credentials.session_id
      }).then(function (user) {
        // TODO: Add `.to_json()` to all API-expressable models.
        return _.pick(user, [
          '_id',
          'name',
          'website',
          'bio',
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
  },

  {
    method: 'PUT',
    path: '/user',
    config: {
      auth: 'session',
      validate: {
        params: {
          name: Joi.string().min(3).max(30),
          website: Joi.string().uri(),
          bio: Joi.string().min(1).max(300)
        }
      }
    },
    handler: function (request, reply) {
      User.findOne({
        session_id: request.auth.credentials.session_id
      }).then(function (user) {
        user = Object.assign(user, request.payload);
        user.save(function (err) {
          if (err) throw new Error('Error saving user: ', err);
          reply(null).code(204);
        });
      }).catch(function (err) {
        reply(Boom.badImplementation(err));
      });
    }
  },

  {
    method: 'GET',
    path: '/user/{id}',
    handler: function (request, reply) {
      User.findOne({
        _id: request.params.id
      }).then(function (user) {
        return _.pick(user, [
          '_id',
          'name',
          'website',
          'bio',
          'profile_pic_uri'
        ]);
      }).then(function (user) {
        Meta.find({user: request.params.id}).then(function (images) {
          user.images = images;
          reply(user);
        });
      }).catch(function (err) {
        reply(Boom.badImplementation(err));
      });
    }
  }
];
