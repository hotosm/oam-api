'use strict';

var _ = require('lodash');
var request = require('request');
var parse = require('wellknown');
var bboxPolygon = require('turf-bbox-polygon');
var Meta = require('../models/meta.js');

/**
* Query Meta model. Implements all protocols supported by /meta endpoint
*
* @param {Object} payload - Payload contains query paramters and their values
* @param {recordsCallback} cb - The callback that returns the records
*/
module.exports.query = function (payload, page, limit, cb) {
  // bounding box search | looks for bbox in payload
  if (_.has(payload, 'bbox')) {
    var bboxPattern = /(-?\d+(?:\.\d*)?,-?\d+(?:\.\d*)?,-?\d+(?:\.\d*)?),-?\d+(?:\.\d*)?/;

    if (bboxPattern.test(payload.bbox)) {
      var coordinates = payload.bbox.split(',').map(parseFloat);
      var geometry = bboxPolygon(coordinates).geometry;
      payload.geojson = {
         $geoIntersects: { $geometry: geometry }
      };

      // remove bbox from payload
      payload = _.omit(payload, 'bbox');
    }
  }

  // Handle date ranges
  if (_.has(payload, 'acquisition_from')) {
    // Test to make sure the date is formatted correctly
    var fromDate = new Date(payload.acquisition_from);
    if (!isNaN(fromDate.getTime())) {
      payload.acquisition_start = { $gte: new Date(payload.acquisition_from) };
    }

    // sanitize payload
    payload = _.omit(payload, 'acquisition_from');
  }
  if (_.has(payload, 'acquisition_to')) {
    // Test to make sure the date is formatted correctly
    var toDate = new Date(payload.acquisition_to);
    if (!isNaN(toDate.getTime())) {
      payload.acquisition_end = { $lte: new Date(payload.acquisition_to) };
    }

    // sanitize payload
    payload = _.omit(payload, 'acquisition_to');
  }

  // Handle resolution ranges
  if (_.has(payload, 'gsd_from') && _.has(payload, 'gsd_to')) {
    payload.gsd = { $gte: payload.gsd_from, $lte: payload.gsd_to };

    // sanitize payload
    payload = _.omit(payload, ['gsd_from', 'gsd_to']);
  } else if (_.has(payload, 'gsd_from')) {
    payload.gsd = { $gte: payload.gsd_from };

    // sanitize payload
    payload = _.omit(payload, 'gsd_from');
  } else if (_.has(payload, 'gsd_to')) {
    payload.gsd = { $lte: payload.gsd_to };

    // sanitize payload
    payload = _.omit(payload, 'gsd_to');
  }

  if (_.has(payload, 'has_tiled')) {
    payload['properties.tms'] = { $exists: true };

    // sanitized payload
    payload = _.omit(payload, 'has_tiled');
  }

  // Handle custom sorts, starting with default of higher resolution and
  // newer imagery first. Do nothing if we don't have both sort and order_by.
  var sort = { gsd: 1, acquisition_end: -1 };
  if (_.has(payload, 'sort') && _.has(payload, 'order_by')) {
    // Custom sort, overwrite default
    sort = {};
    sort[payload.order_by] = (payload.sort === 'asc') ? 1 : -1;

    // sanitized payload
    payload = _.omit(payload, 'sort');
    payload = _.omit(payload, 'order_by');
  } else if (_.has(payload, 'sort')) {
    // sanitized payload
    payload = _.omit(payload, 'sort');
  } else if (_.has(payload, 'order_by')) {
    // sanitized payload
    payload = _.omit(payload, 'order_by');
  }

  var skip = limit * (page - 1);

  // Execute the search and return the result via callback
  Meta.count(payload, function (err, count) {
    if (err) {
      return cb(err, null, null);
    }
    Meta.find(payload, null, { skip: skip, limit: limit }).sort(sort).exec(function (err, records) {
      cb(err, records, count);
    });
  });
};

/**
* Add Meta Information from a provided URI. This function reads the remote json meta file
* and adds the content to Meta model.
* @param {String} remoteUri - a URI to the remote file
* @param {Callback} cb - The callback that handles the response
*/
module.exports.addRemoteMeta = function (remoteUri, lastModified, lastSystemUpdate, cb) {
  // Check if the meta data is already added
  Meta.findOne({meta_uri: remoteUri}, function (err, meta) {
    if (err) {
      return cb(err);
    }

    // if the meta file doesn't exist then add, if the meta file is more recent
    // than our last update, then update
    if (meta === null || lastModified.getTime() > lastSystemUpdate.getTime()) {
      request(remoteUri, function (err, response, body) {
        if (err) {
          return cb(err);
        }
        if (response.statusCode === 200) {
          var payload = JSON.parse(body);
          payload.meta_uri = remoteUri;

          // create a geojson object from footprint and bbox
          payload.geojson = parse(payload.footprint);
          payload.geojson.bbox = payload.bbox;

          var query = { uuid: payload.uuid };
          var options = { upsert: true, new: true, select: { uuid: 1 } };
          Meta.findOneAndUpdate(query, payload, options, function (err, record) {
            if (err) {
              return cb(err);
            }

            var status = (meta === null) ? ' added' : ' updated';
            cb(err, record.uuid + status + '!');
          });
        }
      });
    }
  });
};

/**
 * The records callback that returns the error and records.
 *
 * @callback responseCallback
 * @param {error} err - The error message
 * @param {Object} records - The query records
 * @param {Number} count - Total number of records found
 */
