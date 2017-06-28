'use strict';

var config = require('../config');
var User = require('../models/user');

var isHTTPS = config.env === 'staging' || config.env === 'production';

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
        isSecure: isHTTPS
      });

      server.auth.strategy('session', 'cookie', {
        password: config.cookiePassword,
        cookie: 'oam-browser',
        redirectTo: false,
        validateFunc: User.validateSession.bind(User),
        isSecure: isHTTPS
      });

      next();
    });
  }
};

Authentication.register.attributes = {
  name: 'authentication'
};

module.exports = Authentication;
