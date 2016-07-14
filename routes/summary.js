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
    handler: function (request, reply) {
      return Promise.all([
        Meta.count(),
        Meta.distinct('provider'),
        Meta.distinct('properties.sensor')
      ]).then(function (metrics) {
        var results = {};
        results.images = metrics[0];
        results.providers = metrics[1].length;
        results.sensors = metrics[2].length;
        return reply(results);
      }).catch(function (err) {
        console.log(err);
        return reply(err.message);
      });
    }
  }
];
