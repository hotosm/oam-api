'use strict';

require('envloader').load();

var Conn = require('./services/db.js');
var S3 = require('./services/s3.js');

var db = new Conn(process.env.DBNAME || 'osm-catalog');
db.start();

var s3 = new S3();

// Run bucket update every hour
s3.readBucket(function (err, msg) {
  if (err) {
    console.log(err);
  }
  console.log(msg);
});
setInterval(s3.readBucket, 3600000);
