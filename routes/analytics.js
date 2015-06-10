'use strict';

var _ = require('lodash');
var analytics = require('../controllers/analytics.js');

var analytics = require('../controllers/analytics.js');
// analytics.setLastUpdatedDate();
// setTimeout(function () {
//   analytics.getLastUpdatedDate(function (err, date) {
//     console.log(date);
//   });
// }, 1000);

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
