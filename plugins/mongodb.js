'use strict';

var MongoClient = require('mongodb').MongoClient;
var dbUri = require('../config').dbUri;

/**
 * Exposes the mongodb connection as server.plugins.db.connection
 */
module.exports = function register (server, options, next) {
  server.log(['info'], 'Attempting db connection: ' + dbUri);
  MongoClient.connect(dbUri, function (err, db) {
    server.log(['info'], 'Successful db connection.');
    server.expose('connection', db);
    next(err);
  });
};

module.exports.attributes = { name: 'db' };
