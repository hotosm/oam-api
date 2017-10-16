/**
 * This background process polls S3 buckets for new imagery
 */

'use strict';

console.log('Starting catalog worker...');

require('dotenv').config();

var _ = require('lodash');
var S3 = require('aws-sdk/clients/s3');
var async = require('async');
var config = require('./config');
var Conn = require('./services/db');
var analytics = require('./controllers/analytics');
var meta = require('./controllers/meta');
var Meta = require('./models/meta');
// Replace mongoose's deprecated promise library (mpromise) with bluebird
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var request = require('request');
var cron = require('node-cron');

var db = new Conn();
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
  request.get({
    json: true,
    uri: config.oinRegisterUrl
  }, function (err, res, remoteData) {
    if (err) {
      return cb(err);
    }

    if (res.statusCode !== 200) {
      return console.error('Unable to get register list.');
    }
    var buckets = _.map(remoteData.nodes, function (node) {
      return node.locations;
    });
    buckets = _.flatten(buckets);
    cb(null, buckets);
  });
};

/**
* Runs the readBuckets tasks in parallel and save analytics data when done
*
* @param {Array} tasks - The array of bucket read functions to be run in parallel
*/
var readBuckets = function (tasks) {
  console.info('--- Started indexing all buckets ---');
  async.parallelLimit(tasks, 4,
    // Results is an [[tasks]]
    function (err, results) {
      if (err) {
        return console.error(err);
      }
      results = _.flatten(results);
      results = results.map(function (task) {
        return async.retryable(task);
      });
      async.parallelLimit(results, 5, function (err, results) {
        if (err) {
          return console.error(err);
        }
        console.info('--- Finished indexing all buckets ---');
        // Get image, sensor, and provider counts and save to analytics collection
        return Promise.all([
          Meta.count(),
          Meta.distinct('properties.sensor'),
          Meta.distinct('provider')
        ]).then(function (res) {
          var counts = {};
          counts.image_count = res[0];
          counts.sensor_count = res[1].length;
          counts.provider_count = res[2].length;
          analytics.addAnalyticsRecord(counts, function (err) {
            // Catch error in record addition
            if (err) {
              console.error(err);
            }
            console.info('--- Added new analytics record ---');
          });
        // Catch error in db query promises
        }).catch(function (err) {
          return console.error(err);
        });
      });
    });
};

// Read bucket method for S3. It reads the S3 bucket and adds/updates *_metadata.json to Meta model
var readBucket = function (bucket, lastSystemUpdate, errCb, done) {
  console.info('--- Reading from bucket: ' + bucket.bucket_name + ' ---');

  let bucketDetails = {
    Bucket: bucket.bucket_name
  };

  if (bucket.bucket_name === config.oinBucket) {
    bucketDetails.Prefix = config.oinBucketPrefix;
  }

  var s3 = new S3();
  s3.listObjects(bucketDetails, function (err, data) {
    if (err) {
      errCb(err);
      done(err);
      return;
    }
    var tasks = [];
    data.Contents.forEach(function (item) {
      if (item.Key.includes('_meta.json')) {
        // Get the last time the metadata file was modified so we can determine
        // if we need to update it.
        var lastModified = item.LastModified;
        var url = `https://${config.s3PublicDomain}/${bucket.bucket_name}/${item.Key}`;
        var task = function (done) {
          meta.addRemoteMeta(url, lastModified, lastSystemUpdate, done);
        };
        tasks.push(task);
      }
    });
    done(null, tasks);
  });
};

// The main function to get the registered buckets, read them and update metadata
var getListAndReadBuckets = function () {
  // Start off by getting the last time the system was updated.
  analytics.getLastUpdateTime(function (err, lastSystemUpdate) {
    if (err) {
      return console.error(err);
    }

    console.info('Last system update time:', lastSystemUpdate);
    getBucketList(function (err, buckets) {
      if (err) {
        return console.error(err.stack);
      }

      // Generate array of tasks to run in parallel
      var tasks = _.map(buckets, function (bucket) {
        return function (done) {
          if (bucket.type === 's3') {
            readBucket(bucket, lastSystemUpdate, consoleLog, done);
          } else {
            console.error('Unknown bucket type: ' + bucket.type);
          }
        };
      });

      // Read the buckets and store metadata
      readBuckets(tasks);
    });
  });
};

// Kick it all off
cron.schedule(
  config.cronTime,
  function () {
    console.log(
      'Running a catalog worker (cron time: ' + config.cronTime + ')'
    );
    getListAndReadBuckets();
  }
);
