var cp = require('child_process');

var AWS = require('aws-sdk');
var monq = require('monq');
var promisify = require('es6-promisify');

var config = require('../config');

var batch = new AWS.Batch();
var client = monq(config.dbUri);
var queue = client.queue('transcoder');
var s3bucket = config.oinBucket;

module.exports.transcode = (sourceUrl, output, metaUrl, callback) => {
  var args = [sourceUrl, output, metaUrl];

  var child = cp.spawn('process.sh', args, {
    AWS_ACCESS_KEY_ID: config.awsKey,
    AWS_SECRET_ACCESS_KEY: config.awsSecret,
    AWS_DEFAULT_REGION: config.awsRegion,
    THUMBNAIL_SIZE: config.thumbnailSize
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
      return _callback(
        new Error(
          'Exited with ' + code + ': ' + Buffer.concat(stderr).toString()
        )
      );
    }

    return callback();
  });
};

var batchTranscode = (jobName, input, output, callbackUrl, callback) =>
  batch.submitJob(
    {
      jobDefinition: config.batch.jobDefinition,
      jobName,
      jobQueue: config.batch.jobQueue,
      parameters: {
        input,
        output,
        callback_url: callbackUrl
      }
    },
    (err, data) => callback(err)
  );

var monqTranscode = (sourceUrl, output, metaUrl, callback) =>
  queue.enqueue(
    'transcode',
    {
      sourceUrl: sourceUrl,
      output: output,
      metaUrl: metaUrl
    },
    {
      attempts: {
        count: 1
      }
    },
    (err, job) => callback(err)
  );

var queueImage = (sourceUrl, targetPrefix, metaUrl, callback) => {
  // Namespace the uploaded image under a directory
  if (config.oinBucketPrefix) {
    targetPrefix = config.oinBucketPrefix + '/' + targetPrefix;
  }

  // Google drive url comes in the form of gdrive://FILE_ID
  // We need this because large files can only be downloaded with an api key.
  var pieces = sourceUrl.match(/gdrive:\/\/(.+)/);
  if (pieces) {
    sourceUrl = `https://www.googleapis.com/drive/v3/files/${pieces[1]}?alt=media&key=${config.gdriveKey}`;
  }

  var output = `s3://${s3bucket}/${targetPrefix}`;
  var name = targetPrefix.replace(/\//g, '_');

  if (config.useBatch) {
    return batchTranscode(name, sourceUrl, output, metaUrl, callback);
  }

  return monqTranscode(sourceUrl, output, metaUrl, callback);
};

module.exports.queueImage = promisify(queueImage);
