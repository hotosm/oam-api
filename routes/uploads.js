'use strict';

var Boom = require('boom');
var Joi = require('joi');
var uploadSchema = require('../models/upload');

module.exports = [
  /**
   * @api {get} /uploads List uploads of currently authenticated user.
   * @apiGroup uploads
   * @apiSuccess {Object[]} results
   */
  {
    method: 'GET',
    path: '/uploads',
    config: {
      auth: 'api-token'
    },
    handler: function (request, reply) {
      var user = request.auth.credentials.user.id;
      var db = request.server.plugins.db.connection;
      db.collection('uploads').find({ user: user })
      .toArray(function (err, uploads) {
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
   *
   * @apiExample {js} Example post
   * {
   *   "uploaderInfo": {
   *     "name": "Anand",
   *     "email": "me@foo.com"
   *   },
   *   "contactInfo": {
   *     "name": "Anand",
   *     "email": "me@foo.com"
   *   },
   *   "scenes": [
   *     {
   *       "metadata": {},
   *       "urls": [
   *         "http://myimagery.com/image01.tif",
   *         "http://myimagery.com/image02.tif"
   *       ]
   *     }
   *   ]
   * }
   */
  {
    method: 'POST',
    path: '/uploads',
    config: {
      auth: 'api-token',
      payload: {
        allow: 'application/json',
        output: 'data',
        parse: true
      }
    },
    handler: function (request, reply) {
      Joi.validate(request.payload, uploadSchema, function (err, data) {
        if (err) { return reply(Boom.badRequest(err)); }

        data.user = request.auth.credentials.user.id;
        data.status = 'initial';

        var uploads = request.server.plugins.db.connection.collection('uploads');

        uploads.insertOne(data)
        .then(request.server.plugins.workers.spawn)
        .then(function () { reply('Success'); })
        .catch(function (err) { reply(Boom.wrap(err)); });
      });
    }
  }
];
