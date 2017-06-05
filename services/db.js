'use strict';

var mongoose = require('mongoose');
var config = require('../config');

var Connection = function () {
  mongoose.connect(config.dbUri);
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
  mongoose.connection.close();
};

module.exports = Connection;
