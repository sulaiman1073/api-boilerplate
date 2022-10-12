const glue = require("@hapi/glue");
const Sentry = require("@sentry/node");
const config = require("./config");
const manifest = require("./manifest");

let server;

const initServer = async () => {
  server = await glue.compose(manifest, { relativeTo: __dirname });
  return server;
};

const startServer = async () => {
  await server.start();
  server.log(
    ["serv"],
    `API Server is running on ${server.info.uri} in ${config.mode} mode`
  );

  [
    "SIGINT",
    "SIGTERM",
    "SIGQUIT",
    // "SIGKILL",
    "uncaughtException",
    "unhandledRejection"
  ].forEach(signal => {
    process.on(signal, async () => {
      server.log(["serv"], "Server stopped");
      try {
        if (config.mode === "production") {
          await server.stop({ timeout: 10000 });
          // await closeAllConnections();
        }
        process.exit(0);
      } catch (error) {
        process.exit(1);
      }
    });
  });

  Sentry.init({
    dsn:
      "https://c814699d1c9942feb3b19bf8434eaed3@o433742.ingest.sentry.io/5391785"
  });

  return server;
};

module.exports = { initServer, startServer };
