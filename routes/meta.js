'use strict';

var _ = require('lodash');
var parse = require('wellknown');
var Model = require('../models/meta.js');
var meta = require('../controllers/meta.js');

/**
 * @api {post} /meta Add an image
 * @apiGroup Images
 * @apiDescription Add an image to the catalog. **This is an authenticated endpoint.**
 *
 * @apiParam {string} [uuid] Location of image.
 * @apiParam {string} [footpring] GeoJSON footpring of image.
 * @apiParam {string} [bbox] Bounding box of image
 *
 * @apiUse metaSuccess
 *
 * @apiUse metaSuccessExample
 *
 * @apiError statusCode     The error code
 * @apiError error          Error name
 * @apiError message        Error message
 *
 * @apiErrorExample {json} Error Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      "statusCode": 400,
 *      "error": "Bad Request",
 *      "message": "Missing required data."
 *     }
 */
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

/**
 * @api {get} /meta List all images
 * @apiGroup Images
 * @apiDescription Main endpoint to find data within the catalog
 *
 * @apiParam {string} [bbox] Bounding box to search within. Format `?bbox=[lon_min],[lat_min],[lon_max],[lat_max]`.
 * @apiParam {string} [title] Limit results by `title`.
 * @apiParam {string} [provider] Limit results by `provider`.
 * @apiParam {number} [gsd_from] Find results greater than a certain resolution. Can be used independently of `gsd_to`.
 * @apiParam {number} [gsd_to] Find results with lower than a certain resolution. Can be used independently of `gsd_from`.
 * @apiParam {date} [acquisition_from] Show results after a certain date. Can be used independently of `acquisition_to`.
 * @apiParam {date} [acquisition_to] Show results before a certain date. Can be used independently of `acquisition_from`.
 * @apiParam {boolean} [has_tiled] Return only images with associated tiled images.
 * @apiParam {string} [sort=desc] The sort order, asc or desc. Must be used with `order_by`.
 * @apiParam {string} [order_by=gsd & date] Field to sort by. Must be used with `sort`.
 * @apiParam {number} [limit=100] Change the number of results returned, max is 100.
 * @apiParam {number} [page=1] Paginate through results.
 * @apiParam {number} [skip] Number of records to skip.
 *
 * @apiExample {curl} Simple example:
 *     curl 'https://oam-catalog.herokuapp.com/meta?has_tiled&gsd_to=10'
 *
 * @apiExample {curl} Using bbox:
 *     curl 'https://oam-catalog.herokuapp.com/meta?bbox=-66.15966796875,46.45678142812658,-65.63232421875,46.126556302418514&gsd_from=20&acquisition_from=2014-01-01&limit=100'
 *
 * @apiUse metaSuccess
 *
 * @apiUse metaSuccessExample
 *
 */
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

/**
 * @api {get} /meta/:id Get image detail
 * @apiGroup Images
 * @apiDescription Display data for an individual image
 *
 * @apiParam {string} [id] The id of the image.
 *
 * @apiUse metaSuccess
 *
 * @apiUse metaSuccessExample
 */
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
