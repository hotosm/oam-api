'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/tokens',
    config: {
      auth: 'session',
    },
    handler: function (request, reply) {
      return reply({
        code: 200,
        message: 'LIST endpoint not implemented yet.'
      });
    }
  },

  {
    method: 'POST',
    path: '/tokens',
    config: {
      auth: 'session',
    },
    handler: function (request, reply) {
      return reply({
        code: 200,
        message: 'CREATE endpoint not implemented yet.'
      });
    }
  },

  {
    method: 'PUT',
    path: '/tokens/{token_id}',
    config: {
      auth: 'session',
    },
    handler: function (request, reply) {
      return reply({
        code: 200,
        message: 'UPDATE endpoint not implemented yet.'
      });
    }
  },

  {
    method: 'DELETE',
    path: '/tokens/{token_id}',
    config: {
      auth: 'session',
    },
    handler: function (request, reply) {
      return reply({
        code: 200,
        message: 'DELETE endpoint not implemented yet.'
      });
    }
  }
];
