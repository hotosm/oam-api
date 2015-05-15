'use strict';

var _ = require('lodash');
var bboxPolygon = require('turf-bbox-polygon');
var Meta = require('../models/meta.js');

module.exports.query = function(payload, cb) {

  // bounding box search
  // look for bbox in payload
  if (_.has(payload, 'bbox')) {
    var bboxPattern = /(-?\d+(?:\.\d*)?,-?\d+(?:\.\d*)?,-?\d+(?:\.\d*)?),-?\d+(?:\.\d*)?/;

    if (bboxPattern.test(payload.bbox)) {
      var coordinates = payload.bbox.split(',').map(parseFloat);
      var geometry = bboxPolygon(coordinates).geometry;
      payload.geojson = {
         $geoIntersects: { $geometry: geometry }
      };

      console.log(JSON.stringify(bboxPolygon(coordinates)));

      // remove ul and lr from payload
      payload = _.omit(payload, 'bbox');
    }
  }

  Meta.find(payload, function (err, records) {
    cb(err, records);
  });
};
