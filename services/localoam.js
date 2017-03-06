'use strict';

var meta = require('../controllers/meta.js');
var path = require('path');
var request = require('request');

/**
* LocalOAM Constructor that handles intractions with local OAM bucket server
*
* @constructor
* @param {String} bucket (optional) - Local OAM Bucket URL. Can be set by LOCAL_OAM_BUCKET env var.
*/
var LocalOAM = function (bucket) {
  this.params = {
    bucket: bucket || process.env.LOCAL_OAM_BUCKET
  };
};

/**
* Read bucket method for LocalOAM. It reads the LocalOAM bucket and adds all the `.json` metadata to Meta model
*
* @param {finishedCallback} done - The callback that handles when reading is done
*/

LocalOAM.prototype.readBucket = function (lastSystemUpdate, done) {
  console.info('--- Reading from bucket: ' + this.params.bucket + ' ---');

  var self = this;
  self.tasks = [];

  // List keys in local bucket
  request({
    json: true,
    uri: self.params.bucket + '/list'
  }, function (err, response, payload) {
    if (err) { return done(err); }

    // We have a successful response
    if (response.statusCode === 200 && payload != null) {
      payload.forEach(function (item) {
        var format = path.extname(item.file);

        if (format === '.json') {
          // Get the last time the metadata file was modified so we can determine
          // if we need to update it.
          var lastModified = item.LastModified;
          var url = self.params.bucket + item.file;
          var task = function (done) {
            meta.addRemoteMeta(url, lastModified, lastSystemUpdate, done);
          };
          self.tasks.push(task);
        }
      });
      done(null, self.tasks);
    }
  });
};

 /**
 * The finished callback calls back to the worker with the list of tasks
 *
 * @callback finishedCallback
 * @param {Error} err - The error
 * @param {Function[]} tasks - The tasks
 */
module.exports = LocalOAM;
