'use strict';

var analytics = require('../controllers/analytics.js');

module.exports = [
  {
    method: 'GET',
    path: '/analytics',
    handler: function (request, reply) {
      analytics.query(request.page, request.limit, function (err, records, count) {
        if (err) {
          console.log(err);
          return reply(err.message);
        }

        request.count = count;
        return reply(records);
      });
    }
  }
];
