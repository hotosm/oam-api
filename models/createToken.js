'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

function createToken (id, name, email, scope, expiration) {
  // Sign the JWT
  return jwt.sign(
    {
      _id: id,
      name,
      contact_email: email,
      scope: scope
    },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: expiration
    });
}

module.exports = createToken;
