/**
* Meta controller module
* @module controllers/meta.js
*/
'use strict';

var _ = require('lodash');
var bboxPolygon = require('turf-bbox-polygon');
var Meta = require('../models/meta.js');

/**
* Query Meta model. Implements all protocols supported by /meta endpoint
* @param {Object} payload - Payload contains query paramters and their values
* @param {Callback} cb - The callback that handles the response
*/
module.exports.query = function(payload, cb) {

  // bounding box search | looks for bbox in payload
  if (_.has(payload, 'bbox')) {
    var bboxPattern = /(-?\d+(?:\.\d*)?,-?\d+(?:\.\d*)?,-?\d+(?:\.\d*)?),-?\d+(?:\.\d*)?/;

    if (bboxPattern.test(payload.bbox)) {
      var coordinates = payload.bbox.split(',').map(parseFloat);
      var geometry = bboxPolygon(coordinates).geometry;
      payload.geojson = {
         $geoIntersects: { $geometry: geometry }
      };

      console.log(JSON.stringify(bboxPolygon(coordinates)));

      // remove bbox from payload
      payload = _.omit(payload, 'bbox');
    }
  }

  // Execute the search and return the result via callback
  Meta.find(payload, function (err, records) {
    cb(err, records);
  });
};
