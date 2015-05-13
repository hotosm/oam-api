'use strict';

var Hapi = require('hapi');

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
    routes: '../routes/*.js'
  }
}, function (err) {
  if (err) throw err;
});

module.exports = server;
