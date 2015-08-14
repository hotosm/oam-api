'use strict';

/*
 * A worker that queries the db for new uploads and process 'em.
 */

var onExit = require('exit-hook');
var MongoClient = require('mongodb').MongoClient;
var processUpload = require('./process-upload');
var log = require('./log');
var config = require('../config');

var db;
var workers;
var uploads;
var workerId;

// mongodb queries and updates
var myself = { _id: 'none', state: 'working' };
var lastJobTimestamp = { $currentDate: { lastJobTimestamp: true } };
var stopping = { $set: { state: 'stopping' } };
var jobClaimed = {
  $set: { status: 'pending', _workerId: 'none' },
  $currentDate: { startedAt: true }
};
var jobFinished = {
  $set: { status: 'finished' },
  $unset: { _workerId: '' },
  $currentDate: { stoppedAt: true }
};
function jobErrored (error) {
  error = {
    message: error.message,
    data: JSON.stringify(error)
  };
  return {
    $set: { status: 'errored', error: error },
    $unset: { _workerId: '' },
    $currentDate: { stoppedAt: true }
  };
}

MongoClient.connect(config.dbUri, function (err, connection) {
  if (err) { throw err; }
  db = connection;
  workers = db.collection('workers');
  uploads = db.collection('uploads');

  // clean up
  onExit(cleanup);

  workers.insertOne({ state: 'working' })
  .then(function (result) {
    workerId = result.ops[0]._id;
    jobClaimed['$set']['_workerId'] = workerId;
    myself['_id'] = workerId;
    log.workerId = workerId;

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
      return workers.updateOne(myself, stopping)
      .then(function (result) {
        if (result.modifiedCount === 0) { return mainloop(); }
        return cleanup();
      })
      .catch(cleanup);
    } else {
      // we got a job!
      return processUpload(result.value)
      .then(function (processedResult) {
        return uploads.findOneAndUpdate(result.value, jobFinished);
      })
      .then(function (result) {
        return workers.updateOne(myself, lastJobTimestamp)
        .then(mainloop);
      })
      .catch(function (error) {
        log(['error'], error);
        return uploads.findOneAndUpdate(result.value, jobErrored(error))
        .then(workers.updateOne.bind(workers, myself, lastJobTimestamp))
        .then(mainloop);
      });
    }
  });
}

// claim an upload for this worker to process
function dequeue () {
  return uploads.findOneAndUpdate({status: 'initial'}, jobClaimed, {
    returnOriginal: false
  });
}

function cleanup (err) {
  log('Cleaning up.');
  process.removeAllListeners();

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

