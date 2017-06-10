'use strict';

var db = require('mongoose').connection;
var Joi = require('joi');
var Boom = require('boom');
var ObjectId = require('mongodb').ObjectID;
var crypto = require('crypto');
var _ = require('lodash');

module.exports = [
  {
    method: 'GET',
    path: '/tokens',
    config: {
      auth: 'session'
    },
    handler: function (request, reply) {
      var tokensCol = db.collection('tokens');

      tokensCol.find().toArray(function (err, tokens) {
        if (err) {
          return reply(Boom.wrap(err));
        }

        return reply({
          code: 200,
          message: null,
          data: tokens
        });
      });
    }

  },

  {
    method: 'POST',
    path: '/tokens',
    config: {
      auth: 'session',
      validate: {
        payload: {
          name: Joi.string().required(),
          expiration: Joi.alternatives().try(Joi.date().min('now'), Joi.boolean()).invalid(true).required(),
          status: Joi.any().valid('active', 'blocked').required()
        }
      }
    },
    handler: function (request, reply) {
      var tokensCol = db.collection('tokens');

      // Generate a token.
      var hmac = crypto.createHmac('sha512', 'oam-upload-key');
      hmac.setEncoding('hex');
      hmac.write(Math.random().toString(36));
      hmac.end();

      var data = request.payload;
      data.token = hmac.read().substring(64);
      data.created = new Date();
      data.updated = null;

      tokensCol.insert(data, function (err, res) {
        if (err) {
          return reply(Boom.wrap(err));
        }

        return reply({
          code: 201,
          message: null,
          data: data
        }).code(201);
      });
    }
  },

  {
    method: 'PUT',
    path: '/tokens/{token_id}',
    config: {
      auth: 'session',
      validate: {
        payload: {
          name: Joi.string(),
          expiration: Joi.alternatives().try(Joi.date().min('now'), Joi.boolean()).invalid(true),
          status: Joi.any().valid('active', 'blocked')
        },
        params: {
          token_id: Joi.string().hex().length(24).required()
        }
      }
    },
    handler: function (request, reply) {
      var tokensCol = db.collection('tokens');

      var update = {$set: {}};
      if (request.payload.name !== undefined) {
        update.$set.name = request.payload.name;
      }
      if (request.payload.expiration !== undefined) {
        update.$set.expiration = request.payload.expiration === false ? false : new Date(request.payload.expiration);
      }
      if (request.payload.status !== undefined) {
        update.$set.status = request.payload.status;
      }

      if (_.isEmpty(update.$set)) {
        return reply({
          code: 200,
          message: 'Nothing to update'
        });
      }

      update.$set.updated = new Date();

      tokensCol.findAndModify({_id: new ObjectId(request.params.token_id)}, [], update, {new: true}, function (err, res) {
        if (err) {
          return reply(Boom.wrap(err));
        }

        return reply({
          code: 200,
          message: null,
          data: res.value
        });
      });
    }
  },

  {
    method: 'DELETE',
    path: '/tokens/{token_id}',
    config: {
      auth: 'session',
      validate: {
        params: {
          token_id: Joi.string().hex().length(24).required()
        }
      }
    },
    handler: function (request, reply) {
      var tokensCol = db.collection('tokens');

      tokensCol.remove({_id: new ObjectId(request.params.token_id)}, function (err, res) {
        if (err) {
          return reply(Boom.wrap(err));
        }

        if (res.result.n === 0) {
          return reply(Boom.notFound());
        }

        return reply({
          code: 200,
          message: null
        });
      });
    }
  }
];
