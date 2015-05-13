'use strict';

require('envloader').load();

var s3 = require('s3');
var request = require('request');
var Conn = require('./services/db.js');
var Meta = require('./models/meta.js');

var db = new Conn(process.env.DBNAME || 'osm-catalog');
db.start();

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: {
    accessKeyId: process.env.AWS_SECRET_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

var params = {
  s3Params: {
    Bucket: process.env.S3_BUCKET_NAME /* required */
  }
};

var addMeta = function (metaUri) {
  Meta.findOne({meta_uri: metaUri}, function (err, meta) {
    if (err) {
      console.log(err);
    }

    if (meta === null) {
      request(metaUri, function (err, response, body) {
        if (err) {
          console.log(err);
        }
        if (!err && response.statusCode === 200) {
          var payload = JSON.parse(body);
          payload.metaUri = metaUri;

          var record = new Meta(payload);
          record.save(function (err, record) {
            if (err) {
              console.log(err);
            }
            console.log(record.uuid + ' added!');
          });
        }
      });
    }
  });
};

var readBucket = function (params) {
  var images = client.listObjects(params);

  images.on('error', function (err) {
    console.log(err);
  });

  images.on('data', function (data) {
    for (var i = 0; i < data.Contents.length; i++) {
      var format = data.Contents[i].Key.split('.');
      format = format[format.length - 1];

      if (format === 'json') {
        var url = s3.getPublicUrlHttp(params.s3Params.Bucket, data.Contents[i].Key);
        addMeta(url);
      }
    }
  });
};

// Run bucket update every hour
readBucket(params);
setInterval(readBucket, 3600000, params);
