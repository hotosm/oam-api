'use strict';

var mongoose = require('mongoose');

var Connection = function (dbName, dbUri) {
  this.dbName = dbName;
  this.dbUri = dbUri || 'mongodb://localhost/';
  mongoose.connect(this.dbUri + this.dbName);
  this.db = mongoose.connection;
};

Connection.prototype.start = function (cb) {
  this.db.on('error', console.error.bind(console, 'connection error:'));
  this.db.once('open', function () {
    console.log('connected');
    if (cb) {
      cb();
    }
  });
};

Connection.prototype.deleteDb = function (cb) {
  this.db.db.dropDatabase(function (err) {
    if (err) {
      console.log(err);
    }
    mongoose.connection.close();
    cb();
  });
};

module.exports = Connection;
