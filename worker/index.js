'use strict';

/*
 * A worker that queries the db for new uploads and process 'em.
 */

var MongoClient = require('mongodb').MongoClient;
var dbUri = require('../config').dbUri;
var processUpload = require('./process-upload');

var db;
var workers;
var uploads;
var workerId;
MongoClient.connect(dbUri, function (err, connection) {
  if (err) { throw err; }
  db = connection;
  workers = db.collection('workers');
  uploads = db.collection('uploads');

  process.on('SIGINT', cleanup);

  workers.insertOne({ state: 'working' })
  .then(function (result) {
    workerId = result.ops[0]._id;
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
      log('Processing job', result.value);
      return processUpload(result.value)
      .then(function (processedResult) {
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
  if (err) { logError(err); }
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
        err = error;
        logError('Error cleaning up worker ' + workerId + '; bad news.');
        logError(err);
        db.close();
        process.exit(1);
      });
    }
  } else {
    process.exit(err ? 1 : 0);
  }
}

function log () {
  var args = Array.prototype.slice.call(arguments);
  console.log.apply(console, ['[ Worker ' + workerId + ' ]'].concat(args));
}

function logError () {
  var args = Array.prototype.slice.call(arguments);
  console.error.apply(console, ['[ Worker ' + workerId + ' ]'].concat(args));
}
