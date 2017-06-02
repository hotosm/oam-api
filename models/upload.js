var Joi = require('joi');

var infoSchema = Joi.object().keys({
  name: Joi.string().min(1).max(30).required(),
  email: Joi.string().email()
});

var sceneSchema = Joi.object().keys({
  contact: infoSchema.required(),
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

module.exports = Joi.object().keys({
  uploader: infoSchema.required(),
  scenes: Joi.array().items(sceneSchema).min(1).required()
});
