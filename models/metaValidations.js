var Joi = require('joi');

const getMetaValidation = () => {
  return Joi.object().keys({
    contact: Joi.object().keys({
      name: Joi.string().min(1).max(30).required(),
      email: Joi.string().email()
    }).allow(null),
    title: Joi.string().min(1).required(),
    provider: Joi.string().min(1).required(),
    platform: Joi.any().allow('satellite', 'aircraft', 'uav', 'balloon', 'kite').required(),
    sensor: Joi.string(),
    acquisition_start: Joi.date().required(),
    acquisition_end: Joi.date().required(),
    tms: Joi.string().allow(null),
    license: Joi.string().required(),
    tags: Joi.string().allow(''),
    urls: Joi.array().items(Joi.string().uri({scheme: ['http', 'https', 'gdrive']}))
    .min(1).required()
  });
};

const metaValidations = {
  getSceneValidations: () => {
    return Joi.object().keys({
      scenes: Joi.array().items(getMetaValidation()).min(1).required()
    });
  }
};

module.exports = metaValidations;
