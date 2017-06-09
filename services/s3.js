'use strict';

var config = require('../config');
var s3 = require('s3');
var meta = require('../controllers/meta.js');

/**
* S3 Constructor that handles intractions with S3
*
* @param {String} bucket - S3 Bucket name.
*/
var S3 = function (bucket) {
  this.client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
      accessKeyId: config.awsKey,
      secretAccessKey: config.awsSecret
    }
  });

  this.params = {
    s3Params: {
      Bucket: bucket,
      Prefix: config.oinBucketPrefix
    },
    recursive: true
  };
};

/**
* Read bucket method for S3. It reads the S3 bucket and adds all the `.json` metadata to Meta model
*
* @param {responseCallback} cb - The callback that handles the response
* @param {finishedCallback} finished - The callback that handles when reading is done
*/
S3.prototype.readBucket = function (lastSystemUpdate, cb, done) {
  console.info('--- Reading from bucket: ' + this.params.s3Params.Bucket + ' ---');

  var self = this;
  var images = this.client.listObjects(this.params);
  self.tasks = [];

  images.on('error', function (err) {
    cb(err);
    done(err);
  });

  images.on('data', function (data) {
    data.Contents.forEach(function (item) {
      var format = item.Key.split('.');
      format = format[format.length - 1];

      if (format === 'json') {
        // Get the last time the metadata file was modified so we can determine
        // if we need to update it.
        var lastModified = item.LastModified;
        var url = s3.getPublicUrlHttp(self.params.s3Params.Bucket, item.Key);
        var task = function (done) {
          meta.addRemoteMeta(url, lastModified, lastSystemUpdate, done);
        };
        self.tasks.push(task);
      }
    });
  });

  images.on('end', function () {
    done(null, self.tasks);
  });
};

module.exports = S3;

