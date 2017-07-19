'use strict';

var Hapi = require('hapi');
var config = require('../config');
var Qs = require('qs');

// Parse POST bodies with deep fields like 'field[0]'
var onPostAuth = function (request, reply) {
  if (typeof request.payload === 'object' &&
    !Buffer.isBuffer(request.payload)) {
    request.payload = Qs.parse(request.payload);
  }
  return reply.continue();
};

var Server = function (port) {
  this.port = port;
  this.hapi = new Hapi.Server({
    connections: {
      routes: {
        cors: {
          origin: ['*'],
          credentials: true
        }
      },
      router: {
        stripTrailingSlash: true
      }
    },
    debug: config.debug === 'true' ? {
      log: [ 'error', 'debug', 'info', 'worker' ],
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

  self.hapi.start(function () {
    console.info(
      'Server (' + process.env.NODE_ENV + ') running at:',
      self.hapi.info.uri
    );
    self.hapi.plugins.workers.spawn();
    if (cb) {
      cb();
    }
  });

  self.hapi.ext('onPostAuth', onPostAuth);
};

module.exports = Server;
