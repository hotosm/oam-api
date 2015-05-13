'use strict';

var _ = require('lodash');
var Model = require('../models/provider.js');

module.exports = [
  {
    method: 'POST',
    path: '/providers/add',
    handler: function (request, reply) {
      var response = {};

      if (!_.isEmpty(request.payload) && _.has(request.payload, 'bucket_url')) {
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
        response.error = 'This is an Error. You must provider URI field.';
        return reply(response);
      }
    }
  },
  {
    method: 'GET',
    path: '/providers',
    handler: function (request, reply) {
      var response = {};

      Model.find({}, function (err, records) {
        if (err) {
          return reply(err.message);
        }
        response.results = records;
        return reply(response);
      });
    }
  }
];
