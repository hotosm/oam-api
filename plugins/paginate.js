'use strict';

var _ = require('lodash');

var pagination = {
  register: function (server, options, next) {
    var defaultPage = 1;
    var defaultLimit = options.limit || 100;
    var name = options.name || 'meta';
    var results = options.results || 'results';
    var requestLimit = defaultLimit;
    var requestPage = defaultPage;

    server.ext('onPreHandler', function (request, reply) {
      if (_.has(request.query, 'page')) {
        requestPage = _.parseInt(request.query.page);
        request.query = _.omit(request.query, 'page');
      } else {
        requestPage = defaultPage;
      }

      if (_.has(request.query, 'limit')) {
        requestLimit = _.parseInt(request.query.limit);
        request.query = _.omit(request.query, 'limit');
      } else {
        requestLimit = defaultLimit;
      }

      request.page = requestPage;
      request.limit = requestLimit;

      return reply.continue();
    });

    server.ext('onPreResponse', function (request, reply) {
      var meta = {
        page: requestPage,
        limit: requestLimit
      };

      if (_.has(request, 'count')) {
        meta['found'] = request.count;
      }

      if (_.has(request.response.source, name)) {
        request.response.source[name] = _.merge(request.response.source[name], meta);
      } else {
        // Because we want to add meta to top of the source, we have to go through all this hastle
        var temp = request.response.source;
        request.response.source = {};
        request.response.source[name] = meta;
        request.response.source[results] = temp;
      }

      return reply.continue();
    });

    next();
  }
};

pagination.register.attributes = {
  name: 'hapi-paginate',
  version: '0.1.0'
};

module.exports = pagination;
