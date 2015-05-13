'use strict';

require("envloader").load();
require('./connection.js')

var fs = require('fs');
var s3 = require('s3');
var _ = require('lodash');
var request = require('request');
var Meta = require('./models/meta.js')

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: {
    accessKeyId: process.env.AWS_SECRET_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

var params = {
  s3Params: {
    Bucket: process.env.S3_BUCKET_NAME, /* required */
  },
};

var readBucket = function (params) {
  var images = client.listObjects(params);

  images.on('error', function(err){
    console.log(err);
  });

  images.on('data', function(data){

    for (var i = 0; i < data.Contents.length; i++) {
      var format = data.Contents[i].Key.split('.');
      var format = format[format.length - 1]

      if (format === 'json') {
        var url = s3.getPublicUrlHttp(params.s3Params.Bucket, data.Contents[i].Key);
        addMeta(url);
      }
    }

  });
};

var addMeta = function (meta_uri) {

  Meta.findOne({meta_uri: meta_uri}, function(err, meta){
    if (err) {
      console.log(err);
    }

    if (meta === null) {
      request(meta_uri, function (err, response, body) {
        if (err) {
          console.log(err);
        }
        if (!err && response.statusCode == 200) {
          var payload = JSON.parse(body);
          payload.meta_uri = meta_uri;

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

// Run bucket update every hour
readBucket(params);
setInterval(readBucket, 3600000, [params]);
