'use strict';

var _ = require('lodash');
var Model = require('../models/meta.js');
var meta = require('../controllers/meta.js');

module.exports = [
  {
    method: 'POST',
    path: '/meta/add',
    handler: function (request, reply) {
      var response = {};

      if (!_.isEmpty(request.payload) && _.has(request.payload, 'uuid')) {
        var record = new Model(request.payload);
        record.save(function (err, record) {
          if (err) {
            console.log(err);
            response.error = err.message;
            return reply(response);
          }
          return reply(record);
        });
      } else {
        response.error = 'This is an Error. You must provider UUID field.';
        return reply(response);
      }
    }
  },
  {
    method: 'GET',
    path: '/meta',
    handler: function (request, reply) {
      var response = {};
      var payload = {};

      if (request.query) {
        payload = request.query;
      }

      meta.query(payload, function (err, records) {
        if (err) {
          console.log(err);
          return reply(err.message);
        }

        if (!_.isEmpty(records)) {
          response.meta = {
            count: records.length
          };
          response.results = records;
        } else {
          response.results = {};
          response.message = 'Not Found';
        }

        return reply(response);
      });
    }
  },
  {
    method: 'GET',
    path: '/meta/{id}',
    handler: function (request, reply) {
      var metaId = request.params.id;

      var response = {};

      Model.findOne({_id: metaId}, function (err, record) {
        if (err) {
          return reply(err.message);
        }
        response.results = record;
        return reply(response);
      });
    }
  }
];
