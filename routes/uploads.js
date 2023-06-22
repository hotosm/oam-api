'use strict';

var bbox = require('@turf/bbox');
var envelope = require('@turf/envelope');
var getGeom = require('@turf/invariant').getGeom;
var db = require('mongoose').connection;
var ObjectID = require('mongodb').ObjectID;
var queue = require('queue-async');
var Boom = require('boom');
var Joi = require('joi');
var S3 = require('aws-sdk/clients/s3');
var crypto = require('crypto');
var wellknown = require('wellknown');
var Meta = require('../models/meta');
var config = require('../config');
var transcoder = require('../services/transcoder');
const metaValidations = require('../models/metaValidations.js');
const removeDuplicateVertices = require('../services/removeDuplicateVertices');

var sendgrid = require('sendgrid')(config.sendgridApiKey);
const uploadSchema = metaValidations.getSceneValidations();

function insertImages (scene, name, email, userID) {
  const images = scene.urls.map((url) => {
    const id = new ObjectID();
    return {
      _id: id,
      url: url,
      status: 'initial',
      user_id: userID,
      messages: [],
      metadata: {
        acquisition_end: scene.acquisition_end,
        acquisition_start: scene.acquisition_start,
        contact: `${name},${email}`,
        platform: scene.platform,
        provider: scene.provider,
        properties: {
          license: scene.license,
          sensor: scene.sensor
        },
        title: scene.title
      }
    };
  });
  const imageIds = images.map(image => image._id);
  return db.collection('images').insertMany(images).then(() => imageIds);
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

function hmac (key, value) {
  return crypto.createHmac('sha256', key).update(value).digest();
}

function hexhmac (key, value) {
  return crypto.createHmac('sha256', key).update(value).digest('hex');
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
  {
    method: 'GET',
    path: '/signupload',
    config: {
      auth: 'session',
      tags: ['disablePlugins']
    },
    handler: function (request, reply) {
      const timestamp = request.query.datetime.substr(0, 8);
      const date = hmac('AWS4' + config.awsSecret, timestamp);
      const region = hmac(date, config.awsRegion);
      const service = hmac(region, 's3');
      const signing = hmac(service, 'aws4_request');
      reply(hexhmac(signing, request.query.to_sign));
    }
  },
   /**
    * @api {get} /uploads/url Get presigned URL for upload to S3
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
      var payload = request.payload;
      var s3 = new S3();
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
        if (upload == null) {
          return reply(Boom.notFound('The requested upload does not exist'));
        }

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
   * @api {post} /uploads/:id/:sceneIdx/:imageId Update imagery metadata
   * @apiGroup uploads
   * @apiParam {String} id The id of the upload
   * @apiUse uploadStatusSuccess
   */
  {
    method: 'POST',
    path: '/uploads/{id}/{sceneIdx}/{imageId}',
    config: {
      payload: {
        allow: 'application/json',
        output: 'data',
        parse: true
      }
    },
    handler: function (request, reply) {
      if (!ObjectID.isValid(request.params.id)) {
        return reply(Boom.badRequest('Invalid upload id: ' + request.params.id));
      }

      if (!ObjectID.isValid(request.params.imageId)) {
        return reply(Boom.badRequest('Invalid image id: ' + request.params.imageId));
      }

      var imageId = new ObjectID(request.params.imageId);

      const status = updateUploadStatus(request, imageId);
      const message = updateUploadMessage(request, imageId);
      return Promise.all([status, message])
        .then((values) => {
          let promise = Promise.resolve(true);
          if (values[0] === 'finished') {
            promise = updateUploadMetadata(request, imageId);
          }
          return promise;
        })
        .then(reply)
        .catch(error => reply(Boom.wrap(error)));
    }
  },

  /**
   * @api {post} /uploads Add an upload to the queue
   * @apiGroup uploads
   * @apiPermission Token
   *
   * @apiParam {Object} contactInfo
   * @pariParam {string} contactInfo.name
   * @pariParam {string} contactInfo.email
   * @apiParam {Object[]} scenes
   * @apiParam {Object} scenes.metadata The OAM metadata
   * @apiParam {string[]} scenes.urls The image URLs
   *
   * @apiExample {js} Example post
   * {
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
      const { error: validationError } = Joi.validate(request.payload,
                                                      uploadSchema);
      if (!validationError) {
        return processUpload(request.payload, request, reply)
        .then((upload) => {
          reply(upload);
        })
        .catch((err) => {
          reply(Boom.wrap(err));
        });
      } else {
        request.log(['info'], validationError);
        reply(Boom.badRequest(validationError));
      }
    }
  },
  {
    method: 'POST',
    path: '/dronedeploy',
    config: {
      auth: 'jwt',
      payload: {
        allow: 'application/json',
        output: 'data',
        parse: true
      }
    },
    handler: function (request, reply) {
      const {
        acquisition_start,
        acquisition_end,
        sensor,
        provider,
        tags,
        title
      } = request.query;

      const scene = {
        contact: {
          name: request.auth.credentials.name,
          email: request.auth.credentials.contact_email
        },
        acquisition_start,
        acquisition_end,
        sensor,
        provider,
        tags,
        title,
        tms: null,
        urls: [request.payload.download_path],
        license: 'CC-BY 4.0',
        platform: 'uav'
      };

      const data = { scenes: [scene] };
      const { error: validationError } = Joi.validate(data, uploadSchema);

      if (!validationError) {
        return processUpload(data, request, reply)
          .then((upload) => {
            reply(upload);
          })
          .catch((err) => {
            reply(Boom.wrap(err));
          });
      } else {
        request.log(['info'], validationError);
        reply(Boom.badRequest(validationError));
      }
    }
  }
];

function updateUploadMetadata (request, imageId) {
  return db.collection('images').findOne({
    _id: imageId
  })
  .then(image => {
    const meta = image.metadata;
    const geojson = getGeom(request.payload);
    const boundbox = bbox(geojson);
    meta.user = image.user_id;
    meta.uuid = request.payload.properties.url.replace(/^s3:\/\/([^/]+)\//, `https://$1.${config.s3PublicDomain}/`);
    meta.geojson = geojson;
    meta.geojson.bbox = boundbox;
    meta.bbox = meta.geojson.bbox;
    meta.footprint = wellknown.stringify(envelope(meta.geojson));
    meta.gsd = request.payload.properties.resolution_in_meters;
    meta.file_size = request.payload.properties.size;
    meta.projection = request.payload.properties.projection;
    meta.meta_uri = meta.uuid.replace(/\.tif$/, '_meta.json');
    meta.uploaded_at = new Date();
    meta.properties = Object.assign(meta.properties, request.payload.properties);
    meta.properties.thumbnail = meta.properties.thumbnail.replace(/^s3:\/\/([^/]+)\//, `https://$1.${config.s3PublicDomain}/`);
    meta.properties.tms = `${config.tilerBaseUrl}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?url=${encodeURIComponent(meta.uuid)}`;
    meta.properties.wmts = `${config.tilerBaseUrl}/${request.params.id}/${request.params.sceneIdx}/${request.params.imageId}/wmts`;

    const tilejsonUrl = `${config.tilerBaseUrl}/cog/tilejson.json?url=${encodeURIComponent(meta.uuid)}`;
    meta.properties.tilejson = tilejsonUrl;

    // remove duplicated properties
    delete meta.properties.projection;
    delete meta.properties.size;
    const metaCreate = Meta.create(meta)
      .catch((error) => {
        if (error.code === 16755) {
          // Mutates geojson
          removeDuplicateVertices(request.payload);
          meta.geojson = getGeom(request.payload);
          return Meta.create(meta);
        } else {
          throw error;
        }
      })
      .then(meta => {
        db.collection('images').updateOne({
          _id: imageId
        }, {
          $set: {
            metadata: meta
          }
        });

        return meta;
      })
      .then(meta => meta.oamSync())
      .then(() => true);
    return metaCreate;
  });
}

function updateUploadStatus (request, imageId) {
  const notFinished = 'notFinished';
  const finished = 'finished';
  let promise = Promise.resolve(notFinished);
  if (request.payload.status === 'failed') {
    promise = db.collection('images').updateOne({
      _id: imageId
    }, {
      $set: {
        status: 'errored'
      },
      $currentDate: {
        stoppedAt: true
      }
    })
    .then(() => notFinished);
  }
  if (request.payload.status === 'processing') {
    promise = db.collection('images').updateOne({
      _id: imageId
    }, {
      $set: {
        status: 'processing'
      },
      $currentDate: {
        startedAt: true
      }
    })
    .then(() => notFinished);
  }
  if (request.payload.properties) {
    promise = db.collection('images').updateOne({
      _id: imageId
    }, {
      $set: {
        status: 'finished'
      },
      $currentDate: {
        stoppedAt: true
      }
    })
    .then(() => finished);
  }
  return promise;
}

function updateUploadMessage (request, imageId) {
  let promise = Promise.resolve(true);
  if (request.payload.message != null) {
    promise = db.collection('images').updateOne({
      _id: imageId
    }, {
      $push: {
        messages: {
          status: request.payload.status,
          message: request.payload.message
        }
      }
    });
  }
  return promise;
}

function sendEmail (address, uploadId) {
  return new Promise((resolve, reject) => {
    const message = {
      to: address,
      from: config.sendgridFrom,
      subject: config.emailNotification.subject,
      text: config.emailNotification.text.replace('{UPLOAD_ID}', uploadId)
    };
    sendgrid.send(message, (err, json) => {
      if (err) {
        reject(err);
      } else {
        resolve(json);
      }
    });
  });
}

function processUpload (data, request, reply) {
  const uploadId = new ObjectID();
  const upload = Object.assign({}, data,
    {
      _id: uploadId,
      user: request.auth.credentials._id,
      createdAt: new Date()
    });

  const insertImagePromises = upload.scenes.map((scene) => {
    let name, email;
    if (scene.contact) {
      name = scene.contact.name;
      email = scene.contact.email;
    } else {
      name = request.auth.credentials.name;
      email = request.auth.credentials.contact_email;
    }
    return insertImages(scene, name, email, request.auth.credentials._id);
  });

  const insertImagesAll = Promise.all(insertImagePromises);

  const uploadPromise = insertImagesAll.then((sceneImageIds) => {
    const scenes = upload.scenes.map((scene, sceneIndex) => {
      return Object.assign({}, scene,
                           { images: sceneImageIds[sceneIndex].slice() });
    });
    const uploadWithImages = Object.assign({}, upload, { scenes });
    return db.collection('uploads').insertOne(uploadWithImages);
  });

  sendEmail(request.auth.credentials.contact_email, uploadId)
  .then((json) => {
    request.log(['debug', 'email'], json);
  })
  .catch((error) => {
    request.log(['error', 'email'], error);
  });

  const transcoderPromisesAll =
    Promise.all([uploadPromise, insertImagesAll]).then((results) => {
      const sceneImageIds = results[1];
      const transcoderPromises = upload.scenes
      .reduce((accum, scene, sceneIndex) => {
        const imageIds = sceneImageIds[sceneIndex];
        const queuedImages = imageIds.map((imageId, imageIdIndex) => {
          const key = [uploadId, sceneIndex, imageId].join('/');
          const sourceUrl = scene.urls[imageIdIndex];
          return transcoder.queueImage(sourceUrl, key,
            `${config.apiEndpoint}/uploads/${uploadId}/${sceneIndex}/${imageId}`);
        });
        accum.push(...queuedImages);
        return accum;
      }, []);
      return Promise.all(transcoderPromises);
    });

  return transcoderPromisesAll.then(() => {
    return { upload: upload._id };
  });
}
/**
 * @apiDefine uploadStatusSuccess
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
