'use strict';

var mongoose = require('mongoose');
var Joi = require('joi');

var S3Sync = require('../services/s3_sync');

var metaSchema = new mongoose.Schema({
  // The URI of the image
  uuid: {type: String, unique: true, required: true, dropDups: true},
  // URI of the meta of the image
  meta_uri: {type: String, unique: true, required: false},
  user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  thumb_uri: String,
  title: String,
  projection: String,
  bbox: [Number],
  footprint: String,
  gsd: Number,
  file_size: Number,
  license: String,
  acquisition_start: Date,
  acquisition_end: Date,
  platform: String,
  tags: String,
  provider: String,
  contact: String,
  geojson: {type: mongoose.Schema.Types.Mixed, index: '2dsphere'},
  properties: mongoose.Schema.Types.Mixed,
  custom_tms: mongoose.Schema.Types.Mixed,
  uploaded_at: Date
});

metaSchema.statics = {
  // These are originally from the old oam-uploader-api repo, when uploading was
  // handled by a different service.
  // TODO: Merge with Mongoose's schema
  getMetaValidations: function () {
    return Joi.object().keys({
      contact: Joi.object().keys({
        name: Joi.string().min(1).max(30).required(),
        email: Joi.string().email()
      }).allow(null),
      title: Joi.string().min(1).required(),
      provider: Joi.string().min(1).required(),
      platform: Joi.any().allow('satellite', 'aircraft', 'UAV', 'balloon', 'kite').required(),
      sensor: Joi.string(),
      acquisition_start: Joi.date().required(),
      acquisition_end: Joi.date().required(),
      tms: Joi.string().allow(null),
      license: Joi.string().required(),
      tags: Joi.string().allow(''),
      urls: Joi.array().items(Joi.string().uri({scheme: ['http', 'https', 'gdrive']}))
        .min(1).required()
    });
  },

  getSceneValidations: function () {
    return Joi.object().keys({
      scenes: Joi.array().items(this.getMetaValidations()).min(1).required()
    });
  }
};

metaSchema.methods = {

  oamSync: function (callback) {
    var s3Sync = new S3Sync(this.meta_uri);
    var meta = Object.assign({}, this._doc);

    // remove MongoDB attributes
    delete meta.__v;
    delete meta._id;

    // remove internal tracking
    delete meta.meta_uri;

    s3Sync.uploadMeta(JSON.stringify(meta)).then(callback).catch(callback);
  },

  // Update a metadata object only after the updates have been synced to the corelating
  // _meta.json file on S3.
  oamUpdate: function (newParams, callback) {
    var s3Sync = new S3Sync(this.meta_uri);
    s3Sync.updateRemoteMeta(newParams, () => {
      let updatedMeta = Object.assign(this, newParams);
      updatedMeta.save(function (err) {
        if (err) throw new Error('Error saving meta: ', err);
        callback();
      });
    });
  },

  // Delete a metadata object only after its corelating _meta.json file has
  // been deleted on S3.
  oamDelete: function (callback) {
    var s3Sync = new S3Sync(this.meta_uri);
    s3Sync.deleteRemoteMeta(() => {
      this.remove(function (err) {
        if (err) throw new Error('Error deleting meta: ', err);
        callback();
      });
    });
  }
};

module.exports = mongoose.model('Meta', metaSchema);
