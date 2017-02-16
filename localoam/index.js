var http = require('http');
var filed = require('filed');
var glob = require('glob');
var fs = require('fs');

var master = {
  'nodes': [
    {
      'locations': [
        {
          'type': 'localoam',
          'url': 'http://localoam:4999'
        }
      ]
    }
  ]
};

function sendJSON (json, res) {
  res.setHeader('Content-Type', 'application/json');
  res.write(json);
  res.end();
}

var server = http.createServer(function (req, res) {
  var url = req.url;
  if (url === '/list') {
    // Return all the JSON metadata files with their last modified date
    glob('/data/**/*.json', function (err, files) {
      if (err) {
        console.error(err);
      } else {
        var records = files.map(function (file) {
          // Get last modified time for each file
          var stats = fs.statSync(file);
          return {
            file: file,
            lastModified: stats.mtime
          };
        });
      }
      sendJSON(JSON.stringify(records), res);
    });
  } else if (url === '/master.json') {
    sendJSON(JSON.stringify(master), res);
  } else {
    // else return the file
    req.pipe(filed(url)).pipe(res);
  }
});

server.listen(process.env.PORT || 4999);
