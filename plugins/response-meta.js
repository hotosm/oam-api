'use strict';

var _ = require('lodash');

var responseMeta = {
  register: function (server, options, next) {
    var name = options.key || 'meta';
    var content = options.content || {credit: 'response-meta'};
    var results = options.results || 'results';
    server.ext('onPreResponse', function (request, reply) {
      const { tags } = request.route.settings;
      if (tags && tags.includes('disablePlugins')) {
        // skip processing by this plugin
        return reply.continue();
      }

      if (_.has(request.response.source, name)) {
        request.response.source[name] = _.merge(request.response.source[name], content);
      } else {
        var temp = request.response.source;
        request.response.source = {};
        request.response.source[name] = content;
        request.response.source[results] = temp;
      }

      return reply.continue();
    });

    next();
  }
};

responseMeta.register.attributes = {
  name: 'response-meta',
  version: '0.1.0'
};

module.exports = responseMeta;
