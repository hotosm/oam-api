'use strict';

var analytics = require('../controllers/analytics.js');

/**
 * @api {get} /analytics Platform metadata
 * @apiGroup Analytics
 * @apiDescription Provides metadata about the catalog
 *
 * @apiSuccess {integer}   count      Number of images in catalog
 * @apiSuccess {date}      date       Date and time of data point
 *
 * @apiSuccessExample {json} Success Response:
 *      HTTP/1.1 200 OK
 *      [{
 *       "date": "2015-07-17T18:49:22.452Z",
 *       "count": 856,
 *      },
 *      {
 *       "date": "2015-07-17T17:49:22.452Z",
 *       "count": 856,
 *      }]
 */
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
