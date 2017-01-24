'use strict';

var ObjectID = require('mongodb').ObjectID;
var queue = require('queue-async');
var Boom = require('boom');
var Joi = require('joi');
var uploadSchema = require('../models/upload');
var config = require('../config');

var sendgrid = require('sendgrid')(config.sendgridApiKey);

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
    delete scene.tags;
    delete scene.license;
    callback(err, scene);
  });
}

module.exports = [
  /**
   * @api {get} /uploads List uploads of currently authenticated user.
   * @apiGroup uploads
   * @apiSuccess {Object[]} results
   * @apiUse uploadStatusSuccess
   * @apiPermission Token
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
  /**
   * @api {get} /uploads/:id Get the status of a given upload
   * @apiGroup uploads
   * @apiParam {String} id The id of the upload
   * @apiUse uploadStatusSuccess
   */
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
      .then(function (upload) {
        var q = queue();
        upload.scenes.forEach(function (scene) {
          q.defer(includeImages, db, scene);
        });

        q.awaitAll(function (err) {
          if (err) { return reply(Boom.wrap(err)); }
          reply(upload);
        });
      })
      .catch(function (err) { reply(Boom.wrap(err)); });
    }
  },
  /**
   * @api {post} /uploads Add an upload to the queue
   * @apiGroup uploads
   * @apiPermission Token
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
   *   "uploader": {
   *     "name": "Lady Stardust",
   *     "email": "lady@stardust.xyz"
   *   },
   *   "scenes": [
   *     {
   *       "contact": {
   *         "name": "Sat E Lyte",
   *         "email": "foo@bar.com"
   *       },
   *       "title": "A scene title",
   *       "platform": "UAV",
   *       "provider": "Drones R Us",
   *       "sensor": "DroneModel01",
   *       "acquisition_start": "2015-04-01T00:00:00.000",
   *       "acquisition_end": "2015-04-30T00:00:00.000",
   *       "urls": [
   *         "http://dron.es/image1.tif",
   *         "http://dron.es/image2.tif",
   *         "http://dron.es/image3.tif",
   *       ]
   *     },
   *     {
   *       "contact": {
   *         "name": "Someone Else",
   *         "email": "birds@eye.view.com"
   *       },
   *       "title": "Another title",
   *       "platform": "satellite",
   *       "provider": "Satellites R Us",
   *       "sensor": "SATELLITE_I",
   *       "acquisition_start": "2015-04-01T00:00:00.000",
   *       "acquisition_end": "2015-04-30T00:00:00.000",
   *       "urls": [
   *         "http://satellit.es/image1.tif",
   *         "http://satellit.es/image2.tif",
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
        if (err) {
          request.log(['info'], err);
          return reply(Boom.badRequest(err));
        }

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
          .then(function (result) {
            sendgrid.send({
              to: data.uploader.email,
              from: config.sendgridFrom,
              subject: config.emailNotification.subject,
              text: config.emailNotification.text.replace('{UPLOAD_ID}', data._id)
            }, function (err, json) {
              if (err) { request.log(['error', 'email'], err.message); }
              if (json) { request.log(['debug', 'email'], json); }
            });
            return request.server.plugins.workers.spawn()
            .then(function () {
              reply({ upload: data._id });
            });
          })
          .catch(function (err) { reply(Boom.wrap(err)); });
        });
      });
    }
  }
];
