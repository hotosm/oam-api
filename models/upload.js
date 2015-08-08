var Joi = require('joi');

var infoSchema = Joi.object().keys({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email()
});

var sceneSchema = Joi.object().keys({
  metadata: Joi.object().required(),
  urls: Joi.array().items(Joi.string().uri({scheme: ['http', 'https']}))
    .min(1).required()
});

module.exports = Joi.object().keys({
  uploaderInfo: infoSchema.required(),
  contactInfo: infoSchema.required(),
  scenes: Joi.array().items(sceneSchema).min(1).required()
});
