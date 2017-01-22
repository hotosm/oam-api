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
    '-p', scene.provider,
    '-P', scene.platform,
    '-c', [scene.contact.name.replace(',', ';'), scene.contact.email].join(','),
    '-U', new Date().toISOString()
  ];

  if (scene.tms) {
    args.push('-m', `tms=${scene.tms}`);
  }

  if (scene.sensor) {
    args.push('-m', `sensor=${scene.sensor}`);
  }

  var output = `s3://${s3bucket}/${targetPrefix}`;
  args.push(sourceUrl, output);

  return cp.execFile('process.sh', args, {
    AWS_ACCESS_KEY_ID: AWS.config.credentials.accessKeyId,
    AWS_DEFAULT_REGION: AWS.config.region,
    AWS_SECRET_ACCESS_KEY: AWS.config.credentials.secretAccessKey,
    AWS_SESSION_TOKEN: AWS.config.credentials.sessionToken,
    THUMBNAIL_SIZE: config.thumbnailSize,
    TILER_BASE_URL: config.tilerBaseUrl
  }, function (err, stdout, stderr) {
    if (err) {
      err.stdout = stdout;
      err.stderr = stderr;
      return callback(err);
    }

    log(['debug'], 'Converted image to OAM standard format. Input: ', sourceUrl, 'Output: ', output);

    return request.get({
      json: true,
      uri: `http://${s3bucket}.s3.amazonaws.com/${targetPrefix}_meta.json`
    }, function (err, rsp, metadata) {
      if (err) {
        return callback(err);
      }

      return callback(null, {
        metadata: metadata
      });
    });
  });
}
