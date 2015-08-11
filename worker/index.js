'use strict';

/*
 * A worker that queries the db for new uploads and process 'em.
 */

var MongoClient = require('mongodb').MongoClient;
var processUpload = require('./process-upload');
var log = require('./log');
var config = require('../config');

var db;
var workers;
var uploads;
var workerId;

MongoClient.connect(config.dbUri, function (err, connection) {
  if (err) { throw err; }
  db = connection;
  workers = db.collection('workers');
  uploads = db.collection('uploads');

  process.on('SIGINT', cleanup);

  workers.insertOne({ state: 'working' })
  .then(function (result) {
    log.workerId = workerId = result.ops[0]._id;
    log('Started.');
    return mainloop();
  })
  .catch(cleanup);
});

// main loop
function mainloop () {
  return dequeue()
  .then(function (result) {
    if (!result.value) {
      // no jobs left; try to shut down.
      // avoid race condition by making sure our state wasn't changed from
      // 'working' to something else (by the server) before we actually quit.
      return workers.updateOne({ _id: workerId, state: 'working' }, {
        $set: { state: 'stopping' }
      })
      .then(function (result) {
        if (result.modifiedCount === 0) { return mainloop(); }
        return cleanup();
      });
    } else {
      // we got a job!
      log(['info'], 'Processing job', result.value);
      return processUpload(result.value)
      .then(function (processedResult) {
        log(['debug'], 'Done processing job', processedResult);
        return uploads.findOneAndUpdate(result.value, {
          $set: { status: 'finished' },
          $unset: { _workerId: '' },
          $currentDate: { finishedAt: true }
        });
      })
      .then(function (result) {
        return mainloop();
      });
    }
  });
}

// claim an upload for this worker to process
function dequeue () {
  return uploads.findOneAndUpdate({status: 'initial'}, {
    $set: {
      status: 'pending',
      _workerId: workerId
    },
    $currentDate: { startedAt: true }
  }, { returnOriginal: false });
}

function cleanup (err) {
  log('Cleaning up.');
  if (err) { log(['error'], err); }
  if (db) {
    if (workerId) {
      workers.deleteOne({ _id: workerId })
      .then(function () {
        return uploads.updateMany({ _workerId: workerId, status: 'pending' }, {
          $set: { status: 'initial' },
          $unset: { _workerId: '', startedAt: '' }
        });
      })
      .then(function () {
        db.close();
        process.exit(err ? 1 : 0);
      })
      .catch(function (error) {
        log(['error'], 'Error cleaning up. Bad news.');
        log(['error'], error);
        db.close();
        process.exit(1);
      });
    }
  } else {
    process.exit(err ? 1 : 0);
  }
}

