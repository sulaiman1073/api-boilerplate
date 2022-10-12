const Boom = require("@hapi/boom");

module.exports = {
  name: "auth",
  version: "1.0.0",
  async register(server, options) {
    server.auth.scheme("basic", () => ({
      authenticate(req, res) {
        const auth = req.yar.get("auth");
        if (!auth) throw Boom.unauthorized();
        const { isAuthenticated, credentials } = auth;
        if (!isAuthenticated) throw Boom.unauthorized();
        return res.authenticated({ credentials });
      }
    }));
    server.auth.strategy("simple", "basic");
  }
};
