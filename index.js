'use strict';

require('newrelic');
var Hapi = require('hapi');
var config = require('./config');
var validateToken = require('./services/validate-token');

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
  { register: require('good'), options: config.logOptions }, // logging
  require('./plugins/mongodb'), // exports the db as plugins.db.connection
  require('hapi-auth-bearer-token') // adds bearer-access-token scheme
], function (err) {
  if (err) throw err;

  // Set up API token auth strategy, accepting ?access_token=... or an HTTP
  // bearer authorization header.
  // Use on a route by setting config.auth: 'api-token'.
  hapi.auth.strategy('api-token', 'bearer-access-token', {
    accessTokenName: 'access_token',
    validateFunc: validateToken(hapi.plugins.db.connection)
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
});

hapi.start(function () {
  hapi.log(['info'], 'Server running at:' + hapi.info.uri);
  hapi.log(['debug'], 'Config: ' + JSON.stringify(config));
});
