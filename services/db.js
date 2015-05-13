'use strict';

var mongoose = require('mongoose');

var Connection = function (dbName) {
  this.dbName = dbName;
}

Connection.prototype.start = function () {
  mongoose.connect('mongodb://localhost/' + this.dbName);

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function () {
    console.log('connected');
  });
}

module.exports = Connection;
