'use strict';

var Meta = require('../models/meta.js');

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
    path: '/summary',
    handler: (request, reply) => {
      const handleError = (err) => {
        console.log(err); return reply(err.message);
      };
      return Promise.all([
        Meta.count((err, totalCount) => {
          if (err) handleError(err);
        }),
        Meta.distinct('provider').exec((err, providers) => {
          if (err) handleError(err);
        }),
        Meta.distinct('properties.sensor').exec((err, sensors) => {
          if (err) handleError(err);
        })
      ]).then((metrics) => {
        let results = {};
        results['total_count'] = metrics[0];
        results['providers'] = metrics[1].length;
        results['sensors'] = metrics[2].length;
        return reply(results);
      });
    }
  }
];
