'use strict';

var db = require('mongoose').connection;
var ObjectID = require('mongodb').ObjectID;
var queue = require('queue-async');
var Boom = require('boom');
var Joi = require('joi');
var AWS = require('aws-sdk');

var uploadSchema = require('../models/upload');
var config = require('../config');

var sendgrid = require('sendgrid')(config.sendgridApiKey);

AWS.config = {
  region: config.awsRegion,
  accessKeyId: config.awsKey,
  secretAccessKey: config.awsSecret
};

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
      auth: 'session'
    },
    handler: function (request, reply) {
      var user = request.auth.credentials.id;
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
    * @api {get} /uploads/url Get presigned URL for upload to S3
    * @apiPermission Token
    * @apiParam {Object} payload Parameters sent as object resolvable from request.payload
    * @apiParam {string} payload.name The name of the file to be uploaded
    * @apiParam {string} payload.type The content type of the file to be uploaded
    * @apiUse uploadStatusSuccess
    */
  {
    method: 'POST',
    path: '/uploads/url',
    config: {
      auth: 'session'
    },
    handler: function (request, reply) {
      var payload = JSON.parse(request.payload);
      var s3 = new AWS.S3();
      var params = {
        Bucket: config.uploadBucket,
        Key: payload.name,
        ContentType: payload.type,
        Expires: 60
      };
      s3.getSignedUrl('putObject', params, function (err, url) {
        if (err) {
          console.log(err);
          return reply({code: 500, url: null});
        } else {
          return reply({code: 200, url: url});
        }
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
      auth: 'session',
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

        data.user = request.auth.credentials.id;
        data.createdAt = new Date();

        // pull out the actual images into their own collection, so it can be
        // more easily used as a task queue for the worker(s)
        var q = queue();
        data.scenes.forEach(function (scene) {
          q.defer(insertImages, db, scene);
        });

        q.awaitAll(function (err) {
          if (err) {
            console.log(err);
            return reply(Boom.wrap(err));
          }
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

/**
 * @apiDefine uploadStatusSuccess
 * @apiSuccess {Object} results.uploader Uploader contact info
 * @apiSuccess {String} results.uploader.name
 * @apiSuccess {String} results.uploader.email
 * @apiSuccess {Object[]} results.scenes
 * @apiSuccess {Object} results.scenes.contact Contact person for this scene
 * @apiSuccess {String} results.scenes.contact.name
 * @apiSuccess {String} results.scenes.contact.email
 * @apiSuccess {String} results.scenes.title Scene title
 * @apiSuccess {String="satellite","aircraft","UAV","balloon","kite"} results.scenes.platform
 * @apiSuccess {String} results.scenes.provider Imagery provider
 * @apiSuccess {String} results.scenes.sensor Sensor/device
 * @apiSuccess {String} results.scenes.acquisition_start Date and time of imagery acquisition
 * @apiSuccess {String} results.scenes.acquisition_end Date and time of imagery acquisition
 * @apiSuccess {Object[]} results.scenes.images Array of images in this scene
 * @apiSuccess {String} results.scenes.images.url
 * @apiSuccess {String="initial","processing","finished","errored"} results.scenes.images.status
 * @apiSuccess {String} results.scenes.images.error
 * @apiSuccess {String[]} results.scenes.images.messages
 * @apiSuccess {String} results.scenes.images.startedAt Date and time the processing started
 * @apiSuccess {String} results.scenes.images.stoppedAt Date and time the processing stopped
 */
