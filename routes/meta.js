'use strict';

var _ = require('lodash');
var parse = require('wellknown');
var Model = require('../models/meta.js');
var meta = require('../controllers/meta.js');

module.exports = [
  {
    method: 'POST',
    path: '/meta',
    config: { auth: 'simple' },
    handler: function (request, reply) {
      var response = {};

      if (!_.isEmpty(request.payload) && _.has(request.payload, 'uuid')) {
        var payload = request.payload;

        // create a geojson object from footprint and bbox
        payload.geojson = parse(payload.footprint);
        payload.geojson.bbox = payload.bbox;

        var record = new Model(payload);
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
      var payload = {};

      if (request.query) {
        payload = request.query;
      }

      meta.query(payload, request.page, request.limit, function (err, records, count) {
        if (err) {
          console.log(err);
          return reply(err.message);
        }

        request.count = count;
        return reply(records);
      });
    }
  },
  {
    method: 'GET',
    path: '/meta/{id}',
    handler: function (request, reply) {
      var metaId = request.params.id;

      Model.findOne({_id: metaId}, function (err, record) {
        if (err) {
          return reply(err.message);
        }
        return reply(record);
      });
    }
  }
];
