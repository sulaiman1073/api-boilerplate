const Boom = require("@hapi/boom");

module.exports = async (request, h, err) => {
  if (err.isBoom && err.isJoi) {
    const { details } = err;
    const output = {};

    for (const e of details) {
      const { message, path } = e;
      if (Array.isArray(path) && path.length > 0) {
        output[path[0]] = message;
      } else {
        output["generic-error"] = message;
      }
    }

    const newErr = Boom.badRequest("Invalid Request");
    newErr.output.payload.details = output;

    return newErr;
  }
  return err;
};
