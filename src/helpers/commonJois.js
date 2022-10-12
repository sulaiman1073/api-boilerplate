const Joi = require("@hapi/joi");

module.exports.playerStatusJoi = {
  status: Joi.string().required(),
  queueStartPosition: Joi.number().required(),
  videoStartTime: Joi.number().required(),
  clockStartTime: Joi.string().required()
};
