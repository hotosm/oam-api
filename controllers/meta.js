'use strict';

var _ = require('lodash');
var request = require('request');
var parse = require('wellknown');
var bboxPolygon = require('turf-bbox-polygon');
var Boom = require('boom');
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
    payload['$or'] = [
      {'properties.tms': { $exists: true }},
      {'custom_tms': { $exists: true }}
    ];

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
* @param {Date} lastModified
* @param {Date} lastSystemUpdate
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
    if (meta === null || lastModified > lastSystemUpdate) {
      return request({
        json: true,
        uri: remoteUri
      }, function (err, response, payload) {
        if (err) {
          return cb(err);
        }

        if (response.statusCode === 200 && payload != null) {
          if (payload.uuid == null) {
            // not OIN metadata
            // TODO specify oin-metadata (or something) with a version number
            return cb();
          }

          payload.meta_uri = remoteUri;

          // create a geojson object from footprint and bbox
          payload.geojson = parse(payload.footprint);
          payload.geojson.bbox = payload.bbox;

          var query = { uuid: payload.uuid };
          var options = { upsert: true, new: true, select: { uuid: 1 } };
          return Meta.findOneAndUpdate(query, payload, options, function (err, record) {
            if (err) {
              return cb(err);
            }

            var status = (meta === null) ? ' added' : ' updated';
            return cb(null, record.uuid + status + '!');
          });
        }

        return cb();
      });
    }

    return cb();
  });
};

/**
* Add or Update TMS endpoints related to each image
* @param {String} remoteUri - a URI to the remote file
* @param {String} tmsUri - a URI to the TMS
* @param {Callback} cb - The callback that handles the response
*/
module.exports.addUpdateTms = function (remoteUri, tmsUri, cb) {
  // Check if the meta data is already added
  Meta.findOne({uuid: remoteUri}, function (err, meta) {
    if (err) {
      return cb(err);
    }

    // if the meta file doesn't exist then add, if the meta file is more recent
    // than our last update, then update
    if (meta === null) {
      err = Boom.create(
        400,
        'Image was not found in the catalog!',
        { timestamp: Date.now() }
      );
      return cb(err);
    } else {
      var custom = [];

      if (typeof meta.custom_tms === 'undefined') {
        custom.push(tmsUri);
      } else if (meta.custom_tms.indexOf(tmsUri) === -1) {
        custom = meta.custom_tms;
        custom.push(tmsUri);
      } else {
        // return if the tms uri is already added to the image
        return cb(err, meta);
      }

      // Update the image with the tms uri provided
      Meta.update({uuid: remoteUri}, {custom_tms: custom}, function (err) {
        return cb(err, meta);
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
