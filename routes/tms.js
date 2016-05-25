'use strict';

var _ = require('lodash');
var Boom = require('boom');
var tms = require('../controllers/tms.js');

/**
 * @api {post} /tms Add a TMS
 * @apiGroup TMS
 * @apiDescription Add a TMS (Tiled Map Service) endpoint to the catalog. **This is an authenticated endpoint.**
 *
 * @apiHeader {string} [Authorization] Bearer Token for authentication
 *
 * @apiHeaderExample {json} Request-Example:
 *                      { "Authorization": "Bearer token" }
 *
 * @apiParam {string} [uri] TMS' URI. Must be unique. If a TMS with the same URI has been added before, the TMS' info
 * will be updated
 * @apiParam {object} [images] An array containing the URIs to images included in the TMS.
 *
 * @apiUse tmsSuccess
 *
 * @apiUse tmsSuccessExample
 *
 * @apiError statusCode     The error code
 * @apiError error          Error name
 * @apiError message        Error message
 *
 * @apiExample {curl} Simple example:
 *     curl 'https://oam-catalog.herokuapp.com/tms' -X POST \
 *      -H 'Authorization: Bearer token' \
 *      -H 'Content-Type: application/json' \
 *      -d \
 *      '{
 *        "uri": "http://a.tiles.mapbox.com/v4/droneadv.l8kc6bho/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiZHJvbmVhZHYiLCJhIjoiYmU0ZXQtcyJ9.8Fh95YZQ_WdYEDlgtmH95A",
 *        "images": [{"uuid": "http://hotosm-oam.s3.amazonaws.com/2015-04-17_mburahati_bottomright.tif"}]
 *      }'
 *
 * @apiErrorExample {json} Error Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *      "statusCode": 400,
 *      "error": "Bad Request",
 *      "message": "There is an Error. Fields missing."
 *     }
 */
module.exports = [
  {
    method: 'POST',
    path: '/tms',
    handler: function (request, reply) {
      if (!_.isEmpty(request.payload) && _.has(request.payload, 'uri') && _.has(request.payload, 'images')) {
        tms.addUpdate(request.payload, function (err, record) {
          if (err) {
            return reply(Boom.badRequest(err));
          }

          return reply(record);
        });
      } else {
        var err = Boom.create(
          400,
          'There is an Error. Fields missing.',
          { timestamp: Date.now() }
        );
        return reply(Boom.badRequest(err));
      }
    },
    config: { auth: 'simple' }
  },

/**
 * @api {get} /tms List all TMS endpoints
 * @apiGroup TMS
 * @apiDescription Main endpoint to list TMS endpoints
 *
 * @apiParam {string} [uri] search for a particular TMS URI
 *
 * @apiExample {curl} Simple example:
 *     curl 'https://oam-catalog.herokuapp.com/tms'
 *
 * @apiUse tmsSuccess
 *
 * @apiUse tmsSuccessExample
 *
 */
  {
    method: 'GET',
    path: '/tms',
    handler: function (request, reply) {
      var payload = {};

      if (request.query) {
        payload = request.query;
      }

      tms.query(payload, request.page, request.limit, function (err, records, count) {
        if (err) {
          return reply(err.message);
        }

        request.count = count;
        return reply(records);
      });
    }
  }
];
