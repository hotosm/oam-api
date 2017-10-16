'use strict';

require('newrelic');
require('babel/register');

/*
 * A worker that queries the db for new uploads and process 'em.
 */

var JobQueue = require('./queue');
var onExit = require('exit-hook');

var queue = new JobQueue();

onExit(function () {
  queue.cleanup()
  .then(process.exit.bind(process, 0))
  .catch(process.exit.bind(process, 1));
});

queue.run()
.then(function () { process.exit(); })
.catch(function (err) {
  console.error(err);
  process.exit(1);
});
