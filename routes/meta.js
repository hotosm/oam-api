'use strict';

var bboxPolygon = require('turf-bbox-polygon');
var Boom = require('boom');
var merc = new (require('@mapbox/sphericalmercator'))();

var Meta = require('../models/meta');
var metaController = require('../controllers/meta.js');
var userController = require('../controllers/user.js');

module.exports = [
/**
 * @api {get} /meta List all images' metadata
 * @apiGroup Meta
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

      metaController.query(payload, request.page, request.limit, function (err, records, count) {
        if (err) {
          console.error(err);
          return reply(err.message);
        }

        request.count = count;
        return reply(records);
      });
    }
  },

/**
 * @api {get} /meta/:id Get an image's metadata
 * @apiGroup Meta
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

      Meta.findOne({_id: metaId}, function (err, record) {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err.message));
        }
        return reply(record);
      });
    }
  },
  {
    method: 'GET',
    path: '/meta/{_id}/tilejson.json',
    handler: (request, reply) => {
      const { _id } = request.params;

      return Meta.findOne({ _id }, (err, meta) => {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err.message));
        }

        console.log(meta);

        const approximateZoom = Math.ceil(Math.log2(2 * Math.PI * 6378137 / (meta.gsd * 256)));

        const response = reply({
          name: meta.title,
          bounds: meta.bbox,
          center: [
            (meta.bbox[0] + meta.bbox[2]) / 2,
            (meta.bbox[1] + meta.bbox[3]) / 2,
            approximateZoom - 3
          ],
          maxzoom: approximateZoom + 3,
          minzoom: approximateZoom - 10
        });

        response.plugins.paginate = false;
        response.plugins['response-meta'] = false;

        return response;
      });
    }
  },
  {
    method: 'GET',
    path: '/meta/{_id}/{z}/{x}/{y}.json',
    handler: (request, reply) => {
      const { _id, z, x, y } = request.params;

      const bbox = merc.bbox(x, y, z);
      const { geometry } = bboxPolygon(bbox);

      return Meta.findOne({
        _id,
        geojson: {
          $geoIntersects: {
            $geometry: geometry
          }
        }
      }, (err, meta) => {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err.message));
        }

        if (meta == null) {
          return reply(Boom.notFound());
        }

        const response = reply([{
          url: meta.uuid,
          name: meta.title,
          resolution: meta.gsd,
          recipes: {
            imagery: true
          },
          acquired_at: meta.acquisition_end
        }]);

        response.plugins.paginate = false;
        response.plugins['response-meta'] = false;

        return response;
      });
    }
  },
  {
    method: 'GET',
    path: '/meta/global/tilejson.json',
    handler: (request, reply) => {
      const response = reply({
        name: 'OpenAerialMap',
        bounds: [
          -180,
          -85.05112877980659,
          180,
          85.0511287798066
        ],
        center: [0, 0, 2],
        maxzoom: 30,
        minzoom: 0
      });

      response.plugins.paginate = false;
      response.plugins['response-meta'] = false;

      return response;
    }
  },
  {
    method: 'GET',
    path: '/meta/global/{z}/{x}/{y}.json',
    handler: (request, reply) => {
      const { z, x, y } = request.params;

      const bbox = merc.bbox(x, y, z);
      const { geometry } = bboxPolygon(bbox);

      // TODO sort
      return Meta.find({
        geojson: {
          $geoIntersects: {
            $geometry: geometry
          }
        }
      }, (err, results) => {
        if (err) {
          console.error(err);
          return reply(Boom.badImplementation(err.message));
        }

        const response = reply(results.map(meta => ({
          url: meta.uuid,
          name: meta.title,
          resolution: meta.gsd,
          recipes: {
            imagery: true
          },
          acquired_at: meta.acquisition_end
        })));

        response.plugins.paginate = false;
        response.plugins['response-meta'] = false;

        return response;
      });
    }
  },

/**
 * @api {put} /meta/:id Update an image's metadata
 * @apiGroup Meta
 * @apiDescription Update data for an individual image
 *
 * @apiParam {string} [id] The id of the image.
 *
 * @apiSuccess (204) PageUpdated.
 */
  {
    method: 'PUT',
    path: '/meta/{id}',
    config: {
      auth: 'session',
      pre: [
        {method: metaController.fetchRequestedObject},
        {method: userController.isOwnerOfRequestedObject}
      ]
    },
    handler: function (request, reply) {
      let meta = request.app.requestedObject;
      meta.oamUpdate(request.payload, function (err, _result) {
        if (err) {
          console.error(err);
          reply(Boom.badImplementation(err));
          return;
        }
        reply(null).code(204);
      });
    }
  },

/**
 * @api {delete} /meta/:id Delete an image
 * @apiGroup Meta
 * @apiDescription Delete an image
 *
 * @apiParam {string} [id] The id of the image.
 *
 * @apiSuccess (204) PageUpdated.
 */
  {
    method: 'DELETE',
    path: '/meta/{id}',
    config: {
      auth: 'session',
      pre: [
        {method: metaController.fetchRequestedObject},
        {method: userController.isOwnerOfRequestedObject}
      ]
    },
    handler: function (request, reply) {
      let meta = request.app.requestedObject;
      meta.oamDelete(function (err, _result) {
        if (err) {
          console.error(err);
          reply(Boom.badImplementation(err));
          return;
        }
        reply(null).code(204);
      });
    }
  }
];

// -----------------------------------------------------------------------------
// Meta success return values
// -----------------------------------------------------------------------------
/**
 * @apiDefine metaSuccess
 * @apiSuccess {string}   _id            Unique internal ID
 * @apiSuccess {url}   uuid           Image source
 * @apiSuccess {string}   title           Name of image
 * @apiSuccess {string}   projection     Image projection information
 * @apiSuccess {string}   footprint      Image footprint
 * @apiSuccess {number}   gsd            Spatial resolution of image (in meters)
 * @apiSuccess {number}   file_size      File size of image (in bytes)
 * @apiSuccess {date}   acquisition_start  Start of image capture
 * @apiSuccess {date}   acquisition_end  End of image capture
 * @apiSuccess {string}   platform  Recording platform of image (UAV, satellite, etc)
 * @apiSuccess {string}   provider  Imagery provider
 * @apiSuccess {string}   contact  Imagery contact point
 * @apiSuccess {object}   properties  Optional metadata about the image
 * @apiSuccess {url}   meta_uri  URL of metadata information
 * @apiSuccess {string}   geojson  GeoJSON information for image
 * @apiSuccess {string}   bbox  Bounding box of image
 */

// -----------------------------------------------------------------------------
// Meta success example
// -----------------------------------------------------------------------------
/**
 * @apiDefine metaSuccessExample
 * @apiSuccessExample {json} Success Response:
 *      HTTP/1.1 200 OK
 *       {
 *       "_id": "556f7a49ac00a903002fb016",
 *       "uuid": "http://hotosm-oam.s3.amazonaws.com/2015-04-20_dar_river_merged_transparent_mosaic_group1.tif",
 *       "title": "2015-04-20_dar_river_merged_transparent_mosaic_group1.tif",
 *       "projection": "PROJCS[\"WGS84/UTMzone37S\",GEOGCS[\"WGS84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0],UNIT[\"degree\",0.0174532925199433],AUTHORITY[\"EPSG\",\"4326\"]],PROJECTION[\"Transverse_Mercator\"],PARAMETER[\"latitude_of_origin\",0],PARAMETER[\"central_meridian\",39],PARAMETER[\"scale_factor\",0.9996],PARAMETER[\"false_easting\",500000],PARAMETER[\"false_northing\",10000000],UNIT[\"metre\",1,AUTHORITY[\"EPSG\",\"9001\"]],AUTHORITY[\"EPSG\",\"32737\"]]",
 *       "footprint": "POLYGON((39.24013333333333 -6.755633333333333,39.26116944444444 -6.755622222222223,39.261183333333335 -6.776669444444444,39.24014444444445 -6.776680555555555,39.24013333333333 -6.755633333333333))",
 *       "gsd": 0.04069,
 *       "file_size": 2121158626,
 *       "acquisition_start": "2015-04-20T00:00:00.000Z",
 *       "acquisition_end": "2015-04-21T00:00:00.000Z",
 *       "platform": "UAV",
 *       "provider": "",
 *       "contact": "",
 *       "properties": {
 *       "tms": "",
 *       "thumbnail": ""
 *       },
 *       "meta_uri": "",
 *       "geojson": {},
 *       "bbox": []
 *       }
 */
