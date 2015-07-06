'use strict';

require('envloader').load();

var https = require('https');
var _ = require('lodash');
var Conn = require('./services/db.js');
var S3 = require('./services/s3.js');
var async = require('async');
var analytics = require('./controllers/analytics.js');
var Meta = require('./models/meta.js');

var recheckTime = 1 * 60 * 60 * 1000; // 1 hour
var registerURL = 'https://raw.githubusercontent.com/openimagerynetwork/oin-register/master/master.json';

var db = new Conn(process.env.DBNAME || 'osm-catalog', process.env.DBURI);
db.start();

var consoleLog = function (err, msg) {
  if (err) {
    console.log(err);
  }
  console.log(msg);
};

/**
* Get the list of buckets from the master register
*
* @param {function} cb - Callback with response (buckets) that returns array
* of buckets.
*/
var getBucketList = function (cb) {
  https.get(registerURL, function (res) {
    if (res.statusCode !== 200) {
      return console.error('Unable to get register list.');
    }

    var data = '';
    res.on('data', function (d) {
      data += d;
    });

    res.on('end', function () {
      data = JSON.parse(data);
      var buckets = _.map(data.nodes, function (node) {
        return _.map(node.locations, function (location) {
          return location.bucket_name;
        });
      });
      buckets = _.flatten(buckets);
      cb(buckets);
    });

  }).on('error', function (e) {
    return console.error(e);
  });
};

/**
* Runs the readBuckets tasks in parallel and save analytics data when done
*
* @param {Array} tasks - The array of bucket read functions to be run in parallel
*/
var readBuckets = function (tasks) {
  console.info('--- Started indexing all buckets ---');
  async.parallel(tasks,
  function (err, results) {
    if (err) {
      return console.error(err);
    }
    console.info('--- Finished indexing all buckets ---');
    // Get total record count and save to analytics collection
    Meta.count(null, function (err, count) {
      if (err) {
        return console.error(err);
      }
      analytics.addAnalyticsRecord(count);
    });
  });
};

/**
* The main function to get the registered buckets, read them and update metadata
*/
var getListAndReadBuckets = function () {
  // Start of by getting the last time the system was updated.
  analytics.getLastUpdateTime(function (err, lastSystemUpdate) {
    if (err) {
      return console.error(err);
    }

    getBucketList(function (buckets) {
      // Generate array of tasks to run in parallel
      var tasks = _.map(buckets, function (bucket) {
        return function (done) {
          var s3 = new S3(null, null, bucket);
          s3.readBucket(lastSystemUpdate, consoleLog, done);
        };
      });

      // Read the buckets and store metadata
      readBuckets(tasks);
    });
  });
};

// Kick it all off and keep it going, forever...
getListAndReadBuckets();
setInterval(function () {
  getListAndReadBuckets();
}, recheckTime);
