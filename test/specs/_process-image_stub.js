// Here we are simply stubbing out the whole depdendency on the dynamic tiler

var promisify = require('es6-promisify');

module.exports = promisify(_processImage);

function _processImage (_scene, _sourceUrl, _targetPrefix, callback) {
  return callback(null, {
    metadata: require('../fixtures/NE1_50M_SR.output.json')
  });
}
