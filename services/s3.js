'use strict';

var s3 = require('s3');
var meta = require('../controllers/meta.js');

/**
* S3 Constructor that handles intractions with S3
*
* @constructor
* @param {String} secretId (optional) - AWS secret key id. Can be set by AWS_SECRET_KEY_ID env var.
* @param {String} secretKey (optional) - AWS secret access key. Can be set by AWS_SECRET_ACCESS_KEY env var.
* @param {String} bucket (optional) - S3 Bucket name. Can be set by S3_BUCKET_NAME env var.
*/
var S3 = function (secretId, secretKey, bucket) {
  this.client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
      accessKeyId: secretId || process.env.AWS_SECRET_KEY_ID,
      secretAccessKey: secretKey || process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  this.params = {
    s3Params: {
      Bucket: bucket || process.env.S3_BUCKET_NAME /* required */
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

/**
 * The response callback returns the error and success message.
 *
 * @callback responseCallback
 * @param {error} err - The error message
 * @param {string} msg - The success message
 */

 /**
 * The finished callback just calls back to the worker to let it know there is
 * no more data coming.
 *
 * @callback finishedCallback
 */
