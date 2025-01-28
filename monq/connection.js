var mongoose = require('mongoose');
const job = require('./job');
const Queue = require('./queue');
const Worker = require('./worker');

module.exports = Connection;

/**
 * @constructor
 * @param {string} uri - MongoDB connection string
 * @param {Object} options - connection options
 */
function Connection (uri, options) {
  this.uri = uri;
  this.options = options || {};

  // avoid DeprecationWarning for mongoose v6 --> v7
  mongoose.set('strictQuery', true);
  mongoose.Promise = global.Promise;
  mongoose.connect(uri, this.options);
  this.db = mongoose.connection;
}

/**
 * Returns a new {@link Worker}
 * @param {string[]|string} queues - list of queue names, a single queue name, or '*' for a universal worker
 * @param {Object} options - an object with worker options
 */
Connection.prototype.worker = function (queues, options) {
  var self = this;

  options || (options = {});

  var collection = options.collection || 'jobs';

  if (queues === '*') {
    options.universal = true;

    queues = [self.queue('*', {
      universal: true,
      collection: collection
    })];
  } else {
    if (!Array.isArray(queues)) {
      queues = [queues];
    }

    var queues = queues.map(function (queue) {
      if (typeof queue === 'string') {
        queue = self.queue(queue, {
          collection: collection
        });
      }

      return queue;
    });
  }

  return new Worker(queues, options);
};

Connection.prototype.queue = function (name, options) {
  return new Queue(this, name, options);
};

Connection.prototype.close = function () {
  this.client.close();
};
