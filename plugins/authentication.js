'use strict';

var config = require('../config');
var auth = require('../services/auth');
var validateToken = require('../services/validate-token');
var validateUserCookie = require('../services/validate-user-cookie');

var Authentication = {
  register: function (server, options, next) {
    server.register([
      // Cookie auth.
      { register: require('hapi-auth-cookie') },
      // Basic token authentication plugin
      { register: require('hapi-auth-bearer-token') }
    ], function (err) {
      if (err) throw err;

      server.auth.strategy('simple', 'bearer-access-token', {
        allowQueryToken: true,              // optional, true by default
        allowMultipleHeaders: false,        // optional, false by default
        accessTokenName: 'access_token',    // optional, 'access_token' by default
        validateFunc: auth
      });

      // Set up API token auth strategy, accepting ?access_token=... or an HTTP
      // bearer authorization header.
      // Use on a route by setting config.auth: 'api-token'.
      server.auth.strategy('api-token', 'bearer-access-token', {
        accessTokenName: 'access_token',
        validateFunc: validateToken()
      });

      // Setup cookie auth.
      // Hapi cookie plugin configuration.
      server.auth.strategy('session', 'cookie', {
        password: config.cookiePassword,
        cookie: 'oam-uploader-api',
        redirectTo: false,
        validateFunc: validateUserCookie()
      });

      next();
    });
  }
};

Authentication.register.attributes = {
  name: 'authentication'
};

module.exports = Authentication;
