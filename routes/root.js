'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply('The OAM API');
    }
  }
];
