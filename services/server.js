'use strict';

var Hapi = require('hapi');

var Server = function (port) {
  this.port = port;
};

Server.prototype.start = function (cb) {
  var hapi = new Hapi.Server({
    connections: {
      routes: {
        cors: true
      },
      router: {
        stripTrailingSlash: true
      }
    },
    debug: process.env.OR_DEBUG ? {
      log: [ 'error' ],
      request: [ 'error', 'received', 'response' ]
    } : false
  });

  hapi.connection({ port: this.port });

  // Register routes
  hapi.register([
    {
      register: require('hapi-router'),
      options: {
        routes: './routes/*.js'
      }
    },
    {
      register: require('../plugins/response-meta.js'),
      options: {
        content: {
          provided_by: 'OpenAerialMap',
          license: 'Some License',
          website: 'http://www.example.com'
        }
      }
    },
    {
      register: require('../plugins/paginate.js')
    }
  ], function (err) {
    if (err) throw err;
  });

  hapi.start(function () {
    console.log('Server running at:', hapi.info.uri);
    if (cb) {
      cb();
    }
  });
};

module.exports = Server;
