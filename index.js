'use strict';

require('newrelic');
var Hapi = require('hapi');
var config = require('./config.js');

var hapi = new Hapi.Server({
  connections: {
    routes: {
      cors: true
    },
    router: {
      stripTrailingSlash: true
    }
  }
});

hapi.connection({ port: config.port });

// Register plugins
hapi.register([
  {
    register: require('good'),
    options: config.logOptions
  },
  require('./plugins/mongodb')
], function (err) {
  if (err) throw err;
});

// Register routes
hapi.register([
  {
    register: require('hapi-router'),
    options: {
      routes: './routes/*.js'
    }
  }
], function (err) {
  if (err) throw err;
});

hapi.start(function () {
  hapi.log(['info'], 'Server running at:' + hapi.info.uri);
  hapi.log(['debug'], 'Config: ' + JSON.stringify(config));
});
