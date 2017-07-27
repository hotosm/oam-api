'use strict';

var config = require('../config');
var User = require('../models/user');

var Authentication = {
  register: function (server, options, next) {
    server.register([
      { register: require('hapi-auth-cookie') },
      // Various OAuth login strategies
      { register: require('bell') }
    ], function (err) {
      if (err) throw err;

      // Facebook OAuth login flow
      server.auth.strategy('facebook', 'bell', {
        provider: 'facebook',
        password: config.cookiePassword,
        clientId: config.facebookAppId,
        clientSecret: config.facebookAppSecret,
        isSecure: config.isCookieOverHTTPS
      });

      server.auth.strategy('session', 'cookie', {
        password: config.cookiePassword,
        cookie: config.sessionCookieKey,
        domain: config.hostTld === 'localhost' ? null : config.hostTld,
        clearInvalid: true,
        redirectTo: false,
        validateFunc: User.validateSession.bind(User),
        isHttpOnly: false, // so JS can see it
        isSecure: config.isCookieOverHTTPS
      });

      next();
    });
  }
};

Authentication.register.attributes = {
  name: 'authentication'
};

module.exports = Authentication;
