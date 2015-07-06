'use strict';

var Hapi = require('hapi');
var auth = require('./auth.js');

var Server = function (port) {
  this.port = port;
};

Server.prototype.start = function (cb) {
  var server = new Hapi.Server({
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

  server.connection({ port: this.port });

  // Basic token authentication plugin
  server.register(require('hapi-auth-bearer-token'), function (err) {
    if (err) throw err;

    server.auth.strategy('simple', 'bearer-access-token', {
        allowQueryToken: true,              // optional, true by default
        allowMultipleHeaders: false,        // optional, false by default
        accessTokenName: 'access_token',    // optional, 'access_token' by default
        validateFunc: auth
    });
  });

  // Register routes
  server.register([
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
          license: 'CC-BY 4.0',
          website: 'http://beta.openaerialmap.org'
        }
      }
    },
    {
      register: require('../plugins/paginate.js')
    }
  ], function (err) {
    if (err) throw err;
  });

  server.start(function () {
    console.log('Server running at:', server.info.uri);
    if (cb) {
      cb();
    }
  });
};

module.exports = Server;
