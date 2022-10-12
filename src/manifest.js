const config = require("./config");
const validationFailAction = require("./helpers/validationFailAction");

const manifest = {
  server: {
    port: config.port || 4000,
    host: config.host || "localhost",
    cache: [
      {
        name: "redisCache",
        provider: {
          constructor: require("@hapi/catbox-redis"),
          options: {
            partition: "playnows_cache",
            host: config.redisHost || "localhost",
            port: config.redisPort || 6379,
            db: config.redisIndex || 0,
            password: config.redisPassword || undefined
          }
        }
      }
    ],
    routes: {
      cors: {
        credentials: true,
        origin: config.mode === "production" ? config.corsOrigin : ["*"]
      },
      security:
        config.mode === "production"
          ? {
              hsts: false,
              xss: true,
              noOpen: true,
              noSniff: true,
              xframe: false
            }
          : false,
      timeout: { server: 10000 },
      auth: { strategies: ["simple"] },
      log: { collect: true },
      validate: {
        options: { abortEarly: false },
        failAction: validationFailAction
      },
      response: { sample: config.mode === "production" ? 25 : 100 }
    }
  },
  register: {
    plugins: [
      {
        plugin: require("@hapi/yar"),
        options: {
          name: config.sessionName || "S3SS10N",
          maxCookieSize: config.mode === "testing" ? 1024 : 0,
          cache: { cache: "redisCache", expiresIn: 604800000 },
          cookieOptions: {
            isSecure: config.mode === "production",
            password:
              config.sessionPassword || "really_really_long_session_password",
            ttl: 864000000
          }
        }
      },
      { plugin: require("@hapi/inert") },
      { plugin: require("@hapi/vision") },
      { plugin: require("./plugins/auth") },
      { plugin: require("./plugins/centralLogger") },
      {
        plugin: require("hapi-swagger"),
        options: {
          documentationPath: `/docs`,
          jsonPath: `/swagger.json`,
          uiCompleteScript:
            "document.getElementsByClassName('topbar')[0].style.display = 'none';",
          info: {
            title: "Playnows API Documentation",
            version: require("../package.json").version
          }
        }
      },
      { plugin: require("./plugins/responseTime") },
      {
        plugin: require("./controllers/UserController"),
        routes: { prefix: `/users` }
      },
      {
        plugin: require("./controllers/SessionController"),
        routes: { prefix: `/sessions` }
      },
      {
        plugin: require("./controllers/ChannelController"),
        routes: { prefix: `/channels` }
      },
      {
        plugin: require("./controllers/MemberController"),
        routes: { prefix: `/members` }
      },
      {
        plugin: require("./controllers/MessageController"),
        routes: { prefix: `/messages` }
      },
      {
        plugin: require("./controllers/GifController"),
        routes: { prefix: `/gifs` }
      },
      {
        plugin: require("./controllers/PostController"),
        routes: { prefix: `/posts` }
      },
      {
        plugin: require("./controllers/CommentController"),
        routes: { prefix: `/comments` }
      },
      {
        plugin: require("./controllers/VideoController"),
        routes: { prefix: `/videos` }
      },
      {
        plugin: require("./controllers/NotificationController"),
        routes: { prefix: `/notifications` }
      }
    ]
  }
};

module.exports = manifest;
