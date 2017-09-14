var monq = require('monq');

var config = require('../config');
var transcoder = require('../services/transcoder');

var client = monq(config.dbUri);

var worker = client.worker(['transcoder']);

worker.register({
  transcode: (params, callback) =>
    transcoder.transcode(
      params.sourceUrl,
      params.output,
      params.metaUrl,
      callback
    )
});

worker.on('dequeued', data => console.log('dequeued:', data));
worker.on('failed', data => console.error('failed:', data));
worker.on('complete', data => console.log('complete:', data));
worker.on('error', data => console.error('error:', data));

worker.start();
