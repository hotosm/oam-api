'use strict';

var Meta = require('../models/meta.js');

/**
 * @api {get} /summary Platform summary stats
 * @apiGroup Summary
 * @apiDescription Provides counts of unique images, providers, and sensors
 * in the catalog
 *
 * @apiSuccess {integer}   images     Number of unique images in catalog
 * @apiSuccess {integer}   providers  Number of unique providers in catalog
 * @apiSuccess {integer}   sensors    Number of unique sensors in catalog
 *
 * @apiSuccessExample {json} Success Response:
 *      HTTP/1.1 200 OK
 *      {
 *       "images": 2892,
 *       "providers": 18,
 *       "sensors": 13
 *      }
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
        Meta.count((err, images) => {
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
        results['images'] = metrics[0];
        results['providers'] = metrics[1].length;
        results['sensors'] = metrics[2].length;
        return reply(results);
      });
    }
  }
];
