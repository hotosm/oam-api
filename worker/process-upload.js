'use strict';

var fs = require('fs');
var Promise = require('es6-promise').Promise;
var tmp = require('tmp');
var request = require('request');
var queue = require('queue-async');
var AWS = require('aws-sdk');
var gdalinfo = require('gdalinfo-json');
var applyGdalinfo = require('oam-meta-generator/lib/apply-gdalinfo');
var log = require('./log');
var config = require('../config');

AWS.config = {
  accessKeyId: config.awsKeyId,
  secretAccessKey: config.awsAccessKey,
  region: config.awsRegion,
  sslEnabled: true
};

var s3 = new AWS.S3();
var s3bucket = config.oinBucket;

module.exports = function processUpload (upload) {
  return new Promise(function (resolve, reject) {
    var q = queue(1);
    upload.scenes.forEach(function (scene, i) {
      scene.urls.forEach(function (url, j) {
        var filename = url.split('/').pop() || '';
        q.defer(function (cb) {
          var key = [
            'oam-upload', upload._id, 'scene', i, j + '-' + filename
          ].join('/');
          processUrl(upload, scene, url, key, cb);
        });
      });
    });

    q.awaitAll(function (err, results) {
      if (err) { return reject(err); }
      log(['debug'], results);
      resolve();
    });
  });
};

function processUrl (upload, scene, url, key, callback) {
  tmp.file(function (err, path, fd, cleanup) {
    if (err) { return callback(err); }
    log(['debug'], 'Downloading ' + url + ' to ' + path);
    request(url).pipe(fs.createWriteStream(path))
    .on('finish', function () {
      fs.stat(path, function (err, stat) {
        if (err) { return callback(err); }
        // we've successfully downloaded the file.  now do stuff with it.
        log(['debug'], 'Finished downloading, now generating metadata.');

        var metadata = {
          uuid: publicUrl(s3bucket, key),
          title: scene.title,
          projection: null,
          bbox: null,
          footprint: null,
          gsd: null,
          file_size: stat.size,
          acquisition_start: scene.acquisition_start,
          acquisition_end: scene.acquisition_end,
          platform: scene.platform,
          provider: scene.provider,
          contact: scene.contact,
          properties: {
            tms: scene.tms,
            sensor: scene.sensor,
            thumbnail: 'TBD'
          }
        };

        // TODO: generate thumbnail

        gdalinfo.local(path, function (err, gdaldata) {
          if (err) { return callback(err); }
          applyGdalinfo(metadata, gdaldata);
          log(['debug'], 'Generated metadata: ' + JSON.stringify(metadata));
          log(['debug'], 'Uploading image to s3');
          s3.putObject({
            Body: fs.createReadStream(path),
            Bucket: s3bucket,
            Key: key
          }, function (err, data) {
            cleanup(); // delete tempfile
            if (err) {
              log(['error'], 'Error uploading ' + key);
              return callback(err);
            }
            log(['debug'], 'Uploading metadata to s3');
            s3.putObject({
              Body: JSON.stringify(metadata),
              Bucket: s3bucket,
              Key: key + '_meta.json'
            });
          });
        });
      });
    })
    .on('error', callback);
  });
}

function publicUrl (bucketName, key) {
  return 'http://' + bucketName + '.s3.amazonaws.com/' + key;
}

