const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const { v4: uuidv4 } = require("uuid");
const SessionService = require("../services/SessionService");
const redis = require("../config/redis");

const wsBooth = async loginData => {
  const wsTicket = uuidv4();
  const wsLoginData = {
    userId: loginData.id,
    channels: Object.entries(loginData.channels).map(ch => ({
      id: ch[0],
      type: ch[1].type
    }))
  };
  await redis.setex(wsTicket, 120, JSON.stringify(wsLoginData));
  return wsTicket;
};

const loginResponseSchema = Joi.object()
  .keys({
    id: Joi.string()
      .uuid()
      .required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    username: Joi.string().required(),
    dateOfBirth: Joi.date().required(),
    avatar: Joi.string()
      .uri()
      .allow(null)
      .required(),
    email: Joi.string()
      .email()
      .required(),
    emailVerified: Joi.boolean().required(),
    createdAt: Joi.date().required(),
    channels: Joi.object().required(),
    relationships: Joi.object()
      .keys({
        friends: Joi.array()
          .items(Joi.string().uuid())
          .min(0)
          .required(),
        sentFriendRequests: Joi.array()
          .items(Joi.string().uuid())
          .required(),
        receivedFriendRequests: Joi.array()
          .items(Joi.string().uuid())
          .required(),
        blocked: Joi.array()
          .items(Joi.string().uuid())
          .required(),
        blockers: Joi.array()
          .items(Joi.string().uuid())
          .required()
      })
      .required(),
    users: Joi.object().required(),
    wsTicket: Joi.string()
      .uuid()
      .required()
  })
  .required()
  .label("loginResponse");

const controllers = [
  {
    method: "POST",
    path: "/login",
    options: {
      auth: false,
      description: "Login user",
      tags: ["api"],
      validate: {
        payload: Joi.object()
          .keys({
            usernameOrEmail: Joi.string()
              .required()
              .example("user123"),
            password: Joi.string()
              .required()
              .example("PassW0rd")
          })
          .required()
          .label("loginRequest")
      },
      response: {
        status: {
          200: loginResponseSchema
        }
      }
    },
    async handler(req, res) {
      const loginData = await SessionService.login(req.payload);

      if (!loginData)
        throw Boom.unauthorized("Incorrect username or password.");

      const credentials = { id: loginData.id };

      req.yar.set("auth", {
        ...req.auth,
        isAuthenticated: true,
        credentials
      });

      const wsTicket = await wsBooth(loginData);

      return { ...loginData, wsTicket };
    }
  },
  {
    method: "POST",
    path: "/logout",
    options: {
      description: "Logout user",
      tags: ["api"],
      response: {
        status: {
          204: Joi.object()
            .keys({})
            .required()
            .label("logoutResponse")
        }
      }
    },
    async handler(req, res) {
      req.yar.clear("auth");
      return res.response({}).code(204);
    }
  },
  {
    method: "GET",
    path: "/refresh",
    options: {
      description: "Refresh Session",
      tags: ["api"],
      response: {
        status: {
          200: loginResponseSchema
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const loginData = await SessionService.getLoginData({ userId });

      const wsTicket = await wsBooth(loginData);

      return { ...loginData, wsTicket };
    }
  },
  {
    method: "GET",
    path: "/validate",
    options: {
      description: "Validate Session",
      tags: ["api"],
      response: {
        status: {
          200: loginResponseSchema
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const loginData = await SessionService.getLoginData({ userId });

      const wsTicket = await wsBooth(loginData);

      return { ...loginData, wsTicket };
    }
  }
];

const SessionController = {
  name: "SessionController",
  version: "1.0.0",
  async register(server, options) {
    server.route(controllers);
  }
};

module.exports = SessionController;
