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

  var skip = limit * (page - 1);

  // Execute the search and return the result via callback
  Meta.count(payload, function (err, count) {
    if (err) {
      return cb(err, null, null);
    }
    Meta.find(payload, null, { skip: skip, limit: limit }, function (err, records) {
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
module.exports.addRemoteMeta = function (remoteUri, cb) {
  // Check if the meta data is already added
  Meta.findOne({meta_uri: remoteUri}, function (err, meta) {
    if (err) {
      return cb(err);
    }

    // if the meta file doesn't exist then add
    if (meta === null) {
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

          var record = new Meta(payload);
          record.save(function (err, record) {
            if (err) {
              return cb(err);
            }
            cb(err, record.uuid + ' added!');
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
