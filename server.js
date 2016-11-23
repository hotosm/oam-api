var OAMUploader = require('./');

OAMUploader(function (hapi) {
  // Start the server.
  hapi.start(function () {
    hapi.log(['info'], 'Server running at:' + hapi.info.uri);
    // spawn a worker to handle any unprocessed uploads that may be sitting
    // around in the database
    hapi.plugins.workers.spawn();
  });
});
