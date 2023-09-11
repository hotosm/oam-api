var cp = require('child_process');
var url = require('url');

var AWS = require('aws-sdk');
var monq = require('monq');
var promisify = require('es6-promisify');
var request = require('request');

var config = require('../config');

var batch = new AWS.Batch();
var client = monq(config.dbUri);
var queue = client.queue('transcoder');
var s3 = new AWS.S3();
var s3bucket = config.oinBucket;

module.exports.transcode = (sourceUrl, output, metaUrl, callback) => {
  var args = [sourceUrl, output, metaUrl];

  var child = cp.spawn('process.py', args, {
    AWS_ACCESS_KEY_ID: config.awsKey,
    AWS_SECRET_ACCESS_KEY: config.awsSecret,
    AWS_DEFAULT_REGION: config.awsRegion,
    AWS_REGION: config.awsRegion,
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

var getSize = (sourceUrl, callback) => {
  var uri = url.parse(sourceUrl);

  switch (uri.protocol) {
    case 's3:':
      return s3.headObject({
        Bucket: uri.hostname,
        Key: uri.pathname.slice(1)
      }, (err, data) => {
        if (err) {
          return callback(err);
        }

        return callback(null, data.ContentLength);
      });

    default:
      return request.head(sourceUrl, (err, rsp) => {
        if (err) {
          return callback(err);
        }

        return callback(null, rsp.headers['content-length']);
      });
  }
};

var guessMemoryAllocation = (sourceUrl, callback) =>
  getSize(sourceUrl, (err, size) => {
    if (err) {
      console.warn(err.stack);
      return callback(null, 3000);
    }

    if (!size) {
      console.warn('Unable to get file size by url');
      return callback(null, 3000);
    }

    var mbs = Math.ceil(size / (1024 * 1024));

    // optimistic about source encoding; assume it's the smallest it can be (but
    // cap allocated memory at 30GB)
    // provide a minimum for smaller images
    var recommended = Math.max(3000, Math.min(config.maxBatchMemoryMB, mbs * 10));

    return callback(null, recommended);
  });

var batchTranscode = (jobName, input, output, callbackUrl, callback) =>
  guessMemoryAllocation(input, (_, memory) =>
    batch.submitJob(
      {
        jobDefinition: config.batch.jobDefinition,
        jobName,
        jobQueue: config.batch.jobQueue,
        parameters: {
          input,
          output,
          callback_url: callbackUrl
        },
        containerOverrides: {
          'resourceRequirements': [
            {
              type: 'MEMORY',
              value: `${memory}`
            }
          ]
        }
      },
      (err, data) => callback(err)
    )
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
