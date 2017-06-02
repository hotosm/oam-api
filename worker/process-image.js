'use strict';

var cp = require('child_process');

var AWS = require('aws-sdk');
var promisify = require('es6-promisify');
var request = require('request');

var log = require('./log');
var config = require('../config');

var s3bucket = config.oinBucket;

module.exports = promisify(_processImage);
/**
 * Fully process one URL.
 * Callback called with (err, { metadata, messages })
 */
function _processImage (scene, sourceUrl, targetPrefix, callback) {
  // Google drive url comes in the form of gdrive://FILE_ID
  // We need this because large files can only be downloaded with an api key.
  var pieces = sourceUrl.match(/gdrive:\/\/(.+)/);
  if (pieces) {
    sourceUrl = `https://www.googleapis.com/drive/v3/files/${pieces[1]}?alt=media&key=${config.gdriveKey}`;
  }

  var args = [
    '-t', scene.title,
    '-a', scene.acquisition_start.toISOString(),
    '-A', scene.acquisition_end.toISOString(),
    '--provider', scene.provider,
    '--platform', scene.platform,
    '-c', [scene.contact.name.replace(',', ';'), scene.contact.email].join(','),
    '-U', new Date().toISOString()
  ];

  if (scene.tms) {
    args.push('-m', `tms=${scene.tms}`);
  }

  if (scene.sensor) {
    args.push('-m', `sensor=${scene.sensor}`);
  }

  if (scene.license) {
    args.push('-m', `license=${scene.license}`);
  }

  if (scene.tags) {
    args.push('-m', `tags=${scene.tags}`);
  }

  var output = `s3://${s3bucket}/${targetPrefix}`;
  args.push(sourceUrl, output);

  var child = cp.spawn('process.sh', args, {
    AWS_ACCESS_KEY_ID: AWS.config.credentials.accessKeyId,
    AWS_DEFAULT_REGION: AWS.config.region,
    AWS_SECRET_ACCESS_KEY: AWS.config.credentials.secretAccessKey,
    AWS_SESSION_TOKEN: AWS.config.credentials.sessionToken,
    THUMBNAIL_SIZE: config.thumbnailSize,
    TILER_BASE_URL: config.tilerBaseUrl
  });

  var stderr = [];
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.stderr.on('data', chunk => stderr.push(chunk));

  child.on('error', err => {
    // prevent callback from being called twice
    var _callback = callback;
    callback = function () {};

    return _callback(err);
  });

  child.on('exit', code => {
    // prevent callback from being called twice
    var _callback = callback;
    callback = function () {};

    if (code !== 0) {
      return _callback(new Error('Exited with ' + code + ': ' + Buffer.concat(stderr).toString()));
    }

    log(['debug'], 'Converted image to OAM standard format. Input: ', sourceUrl, 'Output: ', output);

    return request.get({
      json: true,
      uri: `http://${s3bucket}.s3.amazonaws.com/${targetPrefix}_meta.json`
    }, function (err, rsp, metadata) {
      if (err) {
        return _callback(err);
      }

      return _callback(null, {
        metadata: metadata
      });
    });
  });
}
