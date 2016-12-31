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

  var originalLonMinLatMin = new Array(bboxInArray[0], bboxInArray[1])
  var originalLonMaxLatMax = new Array(bboxInArray[2], bboxInArray[3])

  var ct = new gdal.CoordinateTransformation(srcIn, srcOut);
  var transformedLonMinLatMin = ct.transformPoint(originalLonMinLatMin[0], originalLonMinLatMin[1])
  var transformedLonMaxLatMax = ct.transformPoint(originalLonMaxLatMax[0], originalLonMaxLatMax[1])

  var bboxTransformed = [transformedLonMinLatMin['x'],
                         transformedLonMinLatMin['y'],
                         transformedLonMaxLatMax['x'],
                         transformedLonMaxLatMax['y']]
  //console.log(bboxTransformed)
  return bboxTransformed
}
