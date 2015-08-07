'use strict';

var Boom = require('boom');

module.exports = [
  /**
   * @api {get} /uploads List uploads of currently authenticated user.
   * @apiGroup uploads
   * @apiSuccess {Object[]} results
   */
  {
    method: 'GET',
    path: '/uploads',
    handler: function (request, reply) {
      var db = request.server.plugins.db.connection;
      db.collection('uploads').find({}).toArray(function (err, uploads) {
        if (err) { return reply(Boom.wrap(err)); }
        reply({ results: uploads });
      });
    }
  },
  /**
   * @api {post} /uploads Add an upload to the queue
   * @apiGroup uploads
   *
   * @apiParam {Object} uploaderInfo
   * @pariParam {string} uploaderInfo.name
   * @pariParam {string} uploaderInfo.email
   * @apiParam {Object} contactInfo
   * @pariParam {string} contactInfo.name
   * @pariParam {string} contactInfo.email
   * @apiParam {Object[]} scenes
   * @apiParam {Object} scenes.metadata The OAM metadata
   * @apiParam {string[]} scenes.urls The image URLs
   */
  {
    method: 'POST',
    path: '/uploads',
    config: {
      payload: {
        output: 'data',
        parse: true
      }
    },
    handler: function (request, reply) {
      // TODO: validate request

      var db = request.server.plugins.db.connection;
      var uploads = db.collection('uploads');
      uploads.insert([request.payload], function (err, result) {
        request.log(['debug'], result);
        if (err) { return reply(Boom.wrap(err)); }
        // TODO: kick off the job

        reply('Success');
      });
    }
  }
];
