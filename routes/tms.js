'use strict';

var _ = require('lodash');
var Boom = require('boom');
var tms = require('../controllers/tms.js');

module.exports = [
  {
    method: 'POST',
    path: '/tms',
    handler: function (request, reply) {
      if (!_.isEmpty(request.payload) && _.has(request.payload, 'uri') && _.has(request.payload, 'images')) {
        tms.addUpdate(request.payload, function (err, record) {
          if (err) {
            return reply(Boom.badRequest(err));
          }

          return reply(record);
        });
      } else {
        var err = Boom.create(
          400,
          'There is an Error. Fields missing.',
          { timestamp: Date.now() }
        );
        return reply(Boom.badRequest(err));
      }
    },
    config: { auth: 'simple' }
  },
  {
    method: 'GET',
    path: '/tms',
    handler: function (request, reply) {
      var payload = {};

      if (request.query) {
        payload = request.query;
      }

      tms.query(payload, request.page, request.limit, function (err, records, count) {
        if (err) {
          return reply(err.message);
        }

        request.count = count;
        return reply(records);
      });
    }
  }
];
