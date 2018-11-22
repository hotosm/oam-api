'use strict';
var gdal = require('gdal');

/**
* Function which extracts the unit used in the spatial reference system.
*
* @param {string} srsWkt - Spatial Reference System in WKT format
* @return {string} - Unit (metre, degree, or none) used in the input spatial reference system
*/
module.exports.getUnit = function(srsWkt){
  var srs = new gdal.SpatialReference(srsWkt)
  return srs.getAttrValue("unit")
}

/**
* Function which transforms the spatial reference system of footprint.
*
* @param {string} srsWktIn - Input Spatial Reference System in WKT format
* @param {int} numEPSGOut - Spatial Reference System Number (EPSG) for output
* @param {string} footprintWkt - Input footprint in WKT format
* @return {string} - Transformed footprint in WKT format
*/
module.exports.geotransformPolygonTo = function(srsWktIn, numEPSGOut, footprintWkt) {
  var srsIn = new gdal.SpatialReference(srsWktIn);
  var srsOut = gdal.SpatialReference.fromEPSG(numEPSGOut);
  var regExp = /[+-]?\d+(\.\d+)?/g;
  var arrayFootprint = footprintWkt.match(regExp);
  //console.log(arrayFootprint)
  var ct = new gdal.CoordinateTransformation(srsIn, srsOut);
  var wktTransformedFootprint = "POLYGON(("
  for(var i = 0; i < arrayFootprint.length; i += 2) {
    var valueX = parseFloat(arrayFootprint[i])
    var valueY = parseFloat(arrayFootprint[i+1])
    var transformedPoint = ct.transformPoint(valueX, valueY)
    //console.log(transformedPoint)
    wktTransformedFootprint += transformedPoint['x'] + ' ' + transformedPoint['y']
    if(i < arrayFootprint.length - 2) {
      wktTransformedFootprint += ','
    }
  }
  wktTransformedFootprint = wktTransformedFootprint + "))"
  return wktTransformedFootprint
}

/**
* Function which transforms the spatial reference of bounding box in javascript
* array
*
* @param {string} srsWktIn - Input Spatial Reference System in WKT format
* @param {int} numEPSGOut - Spatial Reference System Number (EPSG) for output
* @param {array} bboxInArray - Input bounding box in javascript array
* @return {array} Transformed bounding box in javascript array
*/
module.exports.geotransformBboxTo = function(srsWktIn, numEPSGOut, bboxInArray) {
  var srsIn = new gdal.SpatialReference(srsWktIn)
  var srsOut = new gdal.SpatialReference.fromEPSG(numEPSGOut)
  var originalLonMinLatMin = new Array(bboxInArray[0], bboxInArray[1])
  var originalLonMaxLatMax = new Array(bboxInArray[2], bboxInArray[3])
  var ct = new gdal.CoordinateTransformation(srsIn, srsOut);
  var transformedLonMinLatMin = ct.transformPoint(originalLonMinLatMin[0], originalLonMinLatMin[1])
  var transformedLonMaxLatMax = ct.transformPoint(originalLonMaxLatMax[0], originalLonMaxLatMax[1])
  var bboxTransformed = [transformedLonMinLatMin['x'],
                         transformedLonMinLatMin['y'],
                         transformedLonMaxLatMax['x'],
                         transformedLonMaxLatMax['y']]
  //console.log(bboxTransformed)
  return bboxTransformed
}
