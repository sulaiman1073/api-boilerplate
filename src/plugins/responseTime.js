module.exports = {
  name: "responseTime",
  version: "1.0.0",
  async register(server, options) {
    server.ext("onRequest", (req, h) => {
      req.startTime = process.hrtime();
      return h.continue;
    });

    server.ext("onPreResponse", (req, h) => {
      const elapsedHrTime = process.hrtime(req.startTime);
      const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

      if (!req.response.isBoom) {
        const responseTime = `${elapsedTimeInMs.toLocaleString()}ms`;
        req.responseTime = responseTime;
        req.response.header("X-Response-Time", responseTime);
      }
      return h.continue;
    });
  }
};
