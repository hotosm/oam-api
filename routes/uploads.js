'use strict';

var ObjectID = require('mongodb').ObjectID;
var queue = require('queue-async');
var Boom = require('boom');
var Joi = require('joi');
var uploadSchema = require('../models/upload');

function insertImages (db, scene, callback) {
  var imageIds = [];
  db.collection('images').insertMany(scene.urls.map(function (url) {
    var id = new ObjectID();
    imageIds.push(id);
    return {
      _id: id,
      url: url,
      status: 'initial',
      messages: []
    };
  }), callback);

  // replace the urls list with a list of _id's
  scene.images = imageIds;
  delete scene.urls;
}

function includeImages (db, scene, callback) {
  db.collection('images').find({
    _id: { $in: scene.images }
  })
  .toArray(function (err, images) {
    scene.images = images;
    callback(err, images);
  });
}

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
      var user = request.auth.credentials.id;
      var db = request.server.plugins.db.connection;
      db.collection('uploads').find({ user: user })
      .toArray(function (err, uploads) {
        if (err) { return reply(Boom.wrap(err)); }
        var q = queue();
        uploads.forEach(function (upload) {
          upload.scenes.forEach(function (scene) {
            q.defer(includeImages, db, scene);
          });
        });

        q.awaitAll(function (err) {
          if (err) { return reply(Boom.wrap(err)); }
          reply({ results: uploads });
        });
      });
    }
  },
  {
    method: 'GET',
    path: '/uploads/{id}',
    handler: function (request, reply) {
      if (!ObjectID.isValid(request.params.id)) {
        return reply(Boom.badRequest('Invalid id: ' + request.params.id));
      }
      var db = request.server.plugins.db.connection;
      db.collection('uploads').findOne({
        _id: new ObjectID(request.params.id)
      })
      .then(reply)
      .catch(function (err) { reply(Boom.wrap(err)); });
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

        var db = request.server.plugins.db.connection;

        data.user = request.auth.credentials.id;
        data.createdAt = new Date();

        // pull out the actual images into their own collection, so it can be
        // more easily used as a task queue for the worker(s)
        var q = queue();
        data.scenes.forEach(function (scene) {
          q.defer(insertImages, db, scene);
        });

        q.awaitAll(function (err) {
          if (err) { return reply(Boom.wrap(err)); }
          db.collection('uploads').insertOne(data)
          .then(request.server.plugins.workers.spawn)
          .then(function () { reply('Success'); })
          .catch(function (err) { reply(Boom.wrap(err)); });
        });
      });
    }
  }
];
