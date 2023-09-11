'use strict';
const Bell = require('bell');
var config = require('../config');
var User = require('../models/user');

var Authentication = {
  register: function (server, options, next) {
    if (config.isCookieOverHTTPS) {
      server.ext('onPreAuth', function (request, reply) {
        request.connection.info.protocol = 'https';
        return reply.continue();
      });
    }

    server.register([
      { register: require('hapi-auth-cookie') },
      // Various OAuth login strategies
      { register: require('bell') },
      { register: require('hapi-auth-jwt2') }
    ], function (err) {
      if (err) throw err;

      const facebookCustom = Bell.providers.facebook({
        fields: 'id,name,email,first_name,last_name,picture.type(small)'
      });
      // Facebook OAuth login flow
      server.auth.strategy('facebook', 'bell', {
        provider: facebookCustom,
        password: config.cookiePassword,
        clientId: config.facebookAppId,
        clientSecret: config.facebookAppSecret,
        isSecure: config.isCookieOverHTTPS
      });

      // Google OAuth login flow
      server.auth.strategy('google', 'bell', {
        provider: 'google',
        password: config.cookiePassword,
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
        isSecure: config.isCookieOverHTTPS
      });

      server.auth.strategy('session', 'cookie', {
        ttl: 24 * 60 * 60 * 7000, // 7 days
        keepAlive: true,
        password: config.cookiePassword,
        cookie: config.sessionCookieKey,
        domain: config.hostTld === 'localhost' ? null : config.hostTld,
        clearInvalid: true,
        redirectTo: false,
        validateFunc: User.validateSession.bind(User),
        isHttpOnly: false, // so JS can see it
        isSecure: config.isCookieOverHTTPS
      });

      server.auth.strategy('jwt', 'jwt', {
        key: config.jwtSecret,
        validateFunc: (decoded, request, callback) => callback(null, true),
        verifyOptions: { algorithms: [ 'HS256' ] }
      });
      next();
    });
  }
};

Authentication.register.attributes = {
  name: 'authentication'
};

module.exports = Authentication;
