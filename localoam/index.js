var http = require('http');
var filed = require('filed');
var glob = require('glob');
var es = require('event-stream');
var responseStream = require('response-stream');
var oppressor = require('oppressor');
var path = require('path');
var fs = require('fs');

var HOST = process.env.HOST_PREFIX || 'http://localoam';
var LOCAL_BUCKET_URL = process.env.LOCAL_BUCKET_URL || 'http://localoam:4999';

var master = {
  'nodes': [
    {
      'locations': [
        {
          'type': 'localoam',
          'url': LOCAL_BUCKET_URL
        }
      ]
    }
  ]
};

/**
 * Helper method, stringifies JSON and sets the
 * content header type to JSON
 */
function sendJSON (json, res) {
  res.setHeader('Content-Type', 'application/json');
  if (typeof json !== 'string') {
    json = JSON.stringify(json);
  }
  res.end(json);
}

/**
 * Given a JSON metadata filename
 * Create a tif filename based on the metadata filename and
 * a HOST prefix
 */
function insertMetadata (url) {
  return responseStream(es.mapSync(function (s) {
    if (s === 'Not Found') {
      return s;
    }
    var json = JSON.parse(String(s));
    var uuid = HOST + url.slice(0, url.lastIndexOf('.')) + '.tif';
    json.uuid = uuid;
    json.meta_uri = HOST + url;

    return JSON.stringify(json);
  }));
}

var server = http.createServer(function (req, res) {
  var url = req.url;
  var dataRoot = process.env.DIRECTORY || process.argv[2] || path.join(__dirname, 'data');
  if (url === '/list') {
    // Return all the JSON metadata files with their last modified date
    glob(dataRoot + '/**/*.json', {ignore: [dataRoot + '/node_modules/**', dataRoot + '/package.json']}, function (err, files) {
      if (err) {
        console.error(err);
        res.writeHead('500', {'Content-Type': 'text/plain'});
        return res.end('Server Error');
      } else {
        var records = files.map(function (file) {
          // Get last modified time for each file
          var stats = fs.statSync(file);
          return {
            file: '/' + path.relative(dataRoot, file),
            lastModified: stats.mtime
          };
        });
      }
      return sendJSON(records, res);
    });
  } else if (url === '/master.json') {
    return sendJSON(master, res);
  } else if (url.slice(url.lastIndexOf('.') + 1) === 'json') {
    // We're asking for a metadata file
    return filed(path.join(dataRoot, url))
      .pipe(insertMetadata(url))
      .pipe(oppressor(req))
      .pipe(res);
  } else {
    // else return the file
    return filed(path.join(dataRoot, url)).pipe(res);
  }
});

server.listen(process.env.PORT || 4999);
