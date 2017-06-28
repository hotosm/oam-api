'use strict';

var Model = require('../models/meta');
var meta = require('../controllers/meta');

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

      Model.findOne({_id: metaId}, function (err, record) {
        if (err) {
          return reply(err.message);
        }
        return reply(record);
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
