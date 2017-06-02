'use strict';

var Hapi = require('hapi');

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

  self.hapi.register([
    { register: require('../plugins/workers') },
    { register: require('../plugins/authentication') },
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

  self.hapi.plugins.workers.spawn();

  self.hapi.start(function () {
    console.log('Server running at:', self.hapi.info.uri);
    if (cb) {
      cb();
    }
  });
};

module.exports = Server;
