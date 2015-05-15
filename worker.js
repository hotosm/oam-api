'use strict';

require('envloader').load();

var Conn = require('./services/db.js');
var S3 = require('./services/s3.js');

var db = new Conn(process.env.DBNAME || 'osm-catalog');
db.start();

var s3 = new S3();

var consoleLog = function (err, msg) {
  if (err) {
    console.log(err);
  }
  console.log(msg);
};

// Run bucket update every hour
s3.readBucket(consoleLog);
setInterval(function() {
  s3.readBucket(consoleLog);
}, 3600000);
