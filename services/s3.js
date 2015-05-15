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
    }
  };
};


/**
* Read bucket method for S3. It reads the S3 bucket and adds all the `.json` metadata to Meta model
*
* @param {responseCallback} cb - The callback that handles the response
*/
S3.prototype.readBucket = function (cb) {
  var self = this;
  var images = this.client.listObjects(this.params);

  images.on('error', function (err) {
    cb(err);
  });

  images.on('data', function (data) {
    for (var i = 0; i < data.Contents.length; i++) {
      var format = data.Contents[i].Key.split('.');
      format = format[format.length - 1];

      if (format === 'json') {
        var url = s3.getPublicUrlHttp(self.params.s3Params.Bucket, data.Contents[i].Key);
        meta.addRemoteMeta(url, function (err, msg) {
          if (err) {
            return cb(err);
          }
          cb(err, msg);
        });
      }
    }
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
