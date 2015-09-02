'use strict';

require('newrelic');
require('babel/register');

/*
 * A worker that queries the db for new uploads and process 'em.
 */

var AWS = require('aws-sdk');
var JobQueue = require('./queue');
var onExit = require('exit-hook');
var config = require('../config');

AWS.config = {
  accessKeyId: config.awsKeyId,
  secretAccessKey: config.awsAccessKey,
  region: config.awsRegion,
  sslEnabled: true
};

var s3 = new AWS.S3();
var queue = new JobQueue(s3);

onExit(function () {
  queue.cleanup()
  .then(process.exit.bind(process, 0))
  .catch(process.exit.bind(process, 1));
});

queue.run()
.then(function () { process.exit(); })
.catch(function (err) {
  console.error(err);
  process.exit(1);
});
