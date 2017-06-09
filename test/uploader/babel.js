// Shouldn't really be here, but tests should be merged to
// mocha soon.
require('dotenv').config();

var Babel = require('babel');

module.exports = [
  {
    ext: '.js',
    transform: function (content, filename) {
      if (filename.indexOf('node_modules') === -1) {
        var result = Babel.transform(content, {
          sourceMap: 'inline',
          filename: filename,
          sourceFileName: filename
        });
        return result.code;
      }

      return content;
    }
  }
];
