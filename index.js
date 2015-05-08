'use strict';

var Hapi = require('hapi');
var env = require('./utils/readenv.js')
var conn = require('./connection.js')

var server = new Hapi.Server({
  connections: {
    routes: {
      cors: true
    }
  },
  debug: process.env.OR_DEBUG ? {
    log: [ 'error' ],
    request: [ 'error', 'received', 'response' ]
  } : false
});

server.connection({ port: process.env.PORT || 4000 });

// Register routes
server.register({
  register: require('hapi-router'),
  options: {
    routes: 'routes/*.js'
  }
}, function (err) {
  if (err) throw err;
});


server.start(function () {
  console.log('Server running at:', server.info.uri);
});

module.exports = server;
