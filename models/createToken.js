'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

function createToken (email, scope) {
  // Sign the JWT
  const token = jwt.sign(
    {
      email: email,
      scope: scope
    },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: '1h'
    });
  return Promise.resolve(token);
}

module.exports = createToken;
