'use strict';

var meta = require('../controllers/meta.js');
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
* @param {responseCallback} cb - The callback that handles the response
* @param {finishedCallback} finished - The callback that handles when reading is done
*/

LocalOAM.prototype.readBucket = function (lastSystemUpdate, cb, done) {
  console.info('--- Reading from bucket: ' + this.params.bucket + ' ---');

  var self = this;
  self.tasks = [];

  // List keys in local bucket
  request({
    json: true,
    uri: self.params.bucket + '/list'
  }, function (err, response, payload) {
    if (err) { return cb(err); }

    // We have a successful response
    if (response.statusCode === 200 && payload != null) {
      payload.forEach(function (item) {
        var format = item.file.split('.');
        format = format[format.length - 1];

        if (format === 'json') {
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
 * The response callback returns the error and success message.
 *
 * @callback responseCallback
 * @param {error} err - The error message
 * @param {string} msg - The success message
 */

 /**
 * The finished callback just calls back to the worker to let it know there is
 * no more data coming.
 *
 * @callback finishedCallback
 */
module.exports = LocalOAM;
