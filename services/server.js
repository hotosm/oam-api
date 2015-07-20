'use strict';

var Hapi = require('hapi');
var auth = require('./auth.js');

var Server = function (port) {
  this.port = port;
  this.hapi = new Hapi.Server({
    connections: {
      routes: {
        cors: true
      },
      router: {
        stripTrailingSlash: true
      }
    },
    debug: process.env.OAM_DEBUG ? {
      log: [ 'error' ],
      request: [ 'error', 'received', 'response' ]
    } : false
  });
};

Server.prototype.start = function (cb) {
  var self = this;
  self.hapi.connection({ port: self.port });

  // Basic token authentication plugin
  self.hapi.register(require('hapi-auth-bearer-token'), function (err) {
    if (err) throw err;

    self.hapi.auth.strategy('simple', 'bearer-access-token', {
        allowQueryToken: true,              // optional, true by default
        allowMultipleHeaders: false,        // optional, false by default
        accessTokenName: 'access_token',    // optional, 'access_token' by default
        validateFunc: auth
    });
  });

  // Register routes
  self.hapi.register([
    {
      register: require('hapi-router'),
      options: {
        routes: './routes/*.js',
        ignore: './routes/_apidoc.js'
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

  self.hapi.start(function () {
    console.log('Server running at:', self.hapi.info.uri);
    if (cb) {
      cb();
    }
  });
};

module.exports = Server;
