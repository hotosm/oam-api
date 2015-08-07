'use strict';

var Boom = require('boom');

module.exports = [
  {
    method: 'GET',
    path: '/uploads',
    handler: function (request, reply) {
      var db = request.server.plugins.db.connection;
      db.collection('uploads').find({}).toArray(function (err, uploads) {
        if (err) { return reply(Boom.wrap(err)); }
        reply({ results: uploads });
      });
    }
  },
  {
    method: 'POST',
    path: '/uploads',
    config: {
      payload: {
        output: 'data',
        parse: true
      }
    },
    handler: function (request, reply) {
      var db = request.server.plugins.db.connection;
      var uploads = db.collection('uploads');
      console.log('uploads', uploads);
      uploads.insert([request.payload], function (err, result) {
        request.log(['debug'], result);
        if (err) { return reply(Boom.wrap(err)); }
        reply('Success');
      });
    }
  }
];
