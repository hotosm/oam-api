'use strict';

var mongoose = require('mongoose');
var _ = require('lodash');

var Connection = function (dbName, dbUri) {
  if (!_.isEmpty(dbUri)) {
    this.dbUri = dbUri;
  } else {
    this.dbUri = 'mongodb://localhost/' + dbName;
  }

  mongoose.connect(this.dbUri);
  this.db = mongoose.connection;
};

Connection.prototype.start = function (cb) {
  this.db.on('error', console.error.bind(console, 'connection error:'));
  this.db.once('open', function () {
    console.log('Successfully connected to database.');
    if (cb) {
      cb();
    }
  });
};

Connection.prototype.deleteDb = function (cb) {
  cb = cb || function () {};

  this.db.db.dropDatabase(function (err) {
    if (err) {
      console.log(err);
    }
    mongoose.connection.close();
    cb();
  });
};

Connection.prototype.close = function () {
  mongoose.disconnect();
};

module.exports = Connection;
