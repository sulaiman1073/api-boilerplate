/* eslint-disable no-console */
const fastRedact = require("fast-redact");
const figlet = require("figlet");
const chalk = require("chalk");
const config = require("../config");

const write = log => {
  process.stdout.write(`${log}\n`);
};

const redact = fastRedact({
  paths: ["a.b", "c.d"],
  serialize: true
});

const formattedLogCollection = log => {
  const newLogs = [];

  for (let index = 0; index < log.length; index++) {
    if (log[index].channel !== "internal") {
      if (log[index].error) newLogs.push(log[index].error);
      else newLogs.push(log[index].data);
    }
  }

  return newLogs;
};

module.exports = {
  name: "centralLogger",
  version: "1.0.0",
  async register(server, options) {
    server.ext("onRequest", (request, h) => {
      request.logger = log => request.log(["req"], log);
      return h.continue;
    });

    if (config.mode === "production") {
      server.events.on("response", req => {
        const log = redact({
          id: req.info.id,
          timestamp: req.info.responded,
          host: req.info.hostname,
          remoteAddress: req.info.remoteAddress,
          method: req.method,
          path: req.path,
          statusCode: req.response.statusCode,
          orig: req.orig,
          authenticated: req.auth.isAuthenticated,
          credentials: req.auth.credentials,
          requestHeaders: req.headers,
          responseHeaders: (req.response && req.response.headers) || {},
          response: (req.response && req.response.source) || {},
          responseTime: req.responseTime,
          logs: formattedLogCollection(req.logs)
        });

        write(log);
      });
    } else if (config.mode === "development") {
      // } else {
      server.events.on("response", req => {
        const log = {
          id: req.info.id,
          timestamp: new Date().toLocaleTimeString(),
          endpoint: `${req.method} ${req.path}`,
          orig: req.orig,
          credentials: req.auth.credentials,
          responseTime: req.responseTime,
          response: (req.response && req.response.source) || {},
          logs: formattedLogCollection(req.logs)
        };

        console.log(log);
      });

      server.events.on("log", (event, tags) => {
        console.log(
          chalk.blue.bold(
            figlet.textSync(`/-----`, {
              font: "Wow"
            })
          )
        );
        console.log(
          ` ${chalk.bgGreen.bold(
            ` ${new Date().toLocaleTimeString()} `
          )}${chalk.blue.bold(" | ")}${chalk(event.data)}`
        );
        console.log(
          chalk.blue.bold(
            figlet.textSync(`\\-----`, {
              font: "Wow"
            })
          )
        );
      });
    }
  }
};
