'use strict';

var fs = require('fs');
var Promise = require('es6-promise').Promise;
var tmp = require('tmp');
var moment = require('moment');
var request = require('request');
var queue = require('queue-async');
var AWS = require('aws-sdk');
var gdalinfo = require('gdalinfo-json');
var applyGdalinfo = require('oam-meta-generator/lib/apply-gdalinfo');
var gm = require('gm');
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
  log(['info'], 'Processing job', upload);
  var now = moment().format('YYYY-MM-DD');
  return new Promise(function (resolve, reject) {
    var q = queue(1);
    upload.scenes.forEach(function (scene, i) {
      scene.urls.forEach(function (url, j) {
        var filename = j + (url.split('/').pop() || '');
        q.defer(function (cb) {
          var key = ['uploads', now, upload._id, 'scene', i, filename].join('/');
          processUrl(upload, scene, url, key, cb);
        });
      });
    });

    q.awaitAll(function (err, results) {
      if (err) { return reject(err); }
      log(['debug'], 'Done processing job', results);
      resolve();
    });
  });
};

function processUrl (upload, scene, url, key, callback) {
  tmp.file({ postfix: '.tif' }, function (err, path, fd, cleanup) {
    if (err) { return callback(err); }

    log(['debug'], 'Downloading ' + url + ' to ' + path);

    request(url).pipe(fs.createWriteStream(path))
    .on('finish', function () {
      // we've successfully downloaded the file.  now do stuff with it.
      var thumbKey = key + '.thumb.jpg';
      generateMetadata(scene, path, key, thumbKey, function (err, metadata) {
        if (err) { return callback(err); }
        makeThumbnail(path, function (err, thumbPath) {
          if (err) { return callback(err); }
          var q = queue();
          q.defer(s3.upload.bind(s3), {
            Body: fs.createReadStream(path),
            Bucket: s3bucket,
            Key: key
          });
          q.defer(s3.upload.bind(s3), {
            Body: fs.createReadStream(thumbPath),
            Bucket: s3bucket,
            Key: thumbKey
          });
          q.defer(s3.upload.bind(s3), {
            Body: JSON.stringify(metadata),
            Bucket: s3bucket,
            Key: key + '_meta.json'
          });
          log(['debug'], 'Uploading to s3; bucket=' + s3bucket + ' key=' + key);
          q.awaitAll(function (err, data) {
            cleanup(); // delete tempfile
            log(['debug'], 'Uploaded', data);
            callback(err, data);
          });
        });
      });
    })
    .on('error', callback);
  });
}

function generateMetadata (scene, path, key, thumbKey, callback) {
  log(['debug'], 'Generating metadata.');
  fs.stat(path, function (err, stat) {
    if (err) { return callback(err); }

    var metadata = {
      uuid: null,
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
        thumbnail: publicUrl(s3bucket, thumbKey)
      }
    };

    gdalinfo.local(path, function (err, gdaldata) {
      if (err) { return callback(err); }
      applyGdalinfo(metadata, gdaldata);
      // set uuid after doing applyGdalinfo because it actually sets it to
      // gdaldata.url, which for us is blank since we used gdalinfo.local
      metadata.uuid = publicUrl(s3bucket, key);
      log(['debug'], 'Generated metadata: ' + JSON.stringify(metadata));
      callback(null, metadata);
    });
  });
}

function makeThumbnail (imagePath, callback) {
  tmp.file({ postfix: '.jpg' }, function (err, path, fd, cleanup) {
    if (err) { return callback(err); }
    log(['debug'], 'Generating thumbnail', path);
    gm(imagePath)
      .resize(5, 5, '%')
      .write(path, function (err, stdout, stderr, command) {
        if (err) {
          // the error object itself isn't useful, so let's pass along the
          // stderr output from the gm command
          var msg = 'Error generating thumbnail with "' + command + '":\n';
          return callback(new Error(msg + stderr));
        }
        log(['debug'], 'Finished generating thumbnail');
        callback(null, path);
      });
  });
}

function publicUrl (bucketName, key) {
  return 'http://' + bucketName + '.s3.amazonaws.com/' + key;
}

