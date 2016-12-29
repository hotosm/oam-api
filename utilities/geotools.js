'use strict';

var gdal = require('gdal');

/**
* tool for transforming spatial reference of footprint in wellknown
* text format
*
* @param {int} numEPSGIn - EPSG code of input reference system
* @param {int} numEPSGOut - EPSG code of output reference system
* @param {string} wktFootprint - input footprint in wkt format
* @return {string} - Transformed footprint in wkt format
*/
module.exports.transformWktPolygon = function(numEPSGIn, numEPSGOut, wktFootprint) {
  var srcIn = gdal.SpatialReference.fromEPSG(numEPSGIn)
  var srcOut = gdal.SpatialReference.fromEPSG(numEPSGOut)

  var regExp = /[+-]?\d+(\.\d+)?/g;
  var arrayFootprint = wktFootprint.match(regExp)
  //console.log(arrayFootprint)

  var ct = new gdal.CoordinateTransformation(srcIn, srcOut);
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
* tool for transforming spatial reference of bounding box in javascript
* array
*
* @param {int} numEPSGIn - EPSG code of input reference system
* @param {int} numEPSGOut - EPSG code of output reference system
* @param {array} bboxInArray - Bounding box in javascript array
* @return {array} Transformed bounding box in array
*/
module.exports.transformBbox = function(numEPSGIn, numEPSGOut, bboxInArray) {
  var srcIn = gdal.SpatialReference.fromEPSG(numEPSGIn)
  var srcOut = gdal.SpatialReference.fromEPSG(numEPSGOut)

  var originalLT = new Array(bboxInArray[0], bboxInArray[1])
  var originalRB = new Array(bboxInArray[2], bboxInArray[3])

  var ct = new gdal.CoordinateTransformation(srcIn, srcOut);
  var ptLT = ct.transformPoint(originalLT[0], originalLT[1])
  var ptRB = ct.transformPoint(originalRB[0], originalRB[1])

  var bboxTransformed = [ptLT['x'], ptLT['y'], ptRB['x'], ptRB['y']]
  //console.log(bboxTransformed)
  return bboxTransformed
}
