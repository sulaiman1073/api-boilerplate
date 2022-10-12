const Joi = require("@hapi/joi");
const { WS_EVENTS } = require("../config/constants");
const publisher = require("../config/publisher");
const ChannelService = require("../services/ChannelService");
const UserService = require("../services/UserService");
const { playerStatusJoi } = require("../helpers/commonJois");
const redis = require("../config/redis");

const playerValidation = {
  params: Joi.object()
    .keys({
      channelId: Joi.string()
        .uuid()
        .required()
    })
    .required(),
  payload: Joi.object()
    .keys({
      queueStartPosition: Joi.number().required(),
      clockStartTime: Joi.string().required(),
      videoStartTime: Joi.number().required()
    })
    .required()
};

const playerReturnKeys = {
  channelId: Joi.string()
    .uuid()
    .required(),
  queueStartPosition: Joi.number().required(),
  clockStartTime: Joi.date().timestamp(),
  videoStartTime: Joi.number().required()
};

const controllers = [
  {
    method: "POST",
    path: "/",
    options: {
      description: "Adds channel",
      tags: ["api"],
      payload: { multipart: { output: "annotated" } },
      plugins: { "hapi-swagger": { payloadType: "form" } },
      validate: {
        payload: Joi.object()
          .keys({
            name: Joi.string()
              .min(3)
              .max(20)
              .required(),
            description: Joi.string()
              .min(1)
              .max(150)
              .required(),
            icon: Joi.optional().meta({ swaggerType: "file" }),
            public: Joi.boolean().required()
          })
          .required()
      }
      // response: {
      //   status: {
      //     201: Joi.object()
      //       .keys({
      //         channelId: Joi.string()
      //           .uuid()
      //           .required(),
      //         channel: Joi.object().keys({
      //           id: Joi.string()
      //             .uuid()
      //             .required(),
      //           type: Joi.string()
      //             .valid("channel")
      //             .required(),
      //           name: Joi.string().required(),
      //           description: Joi.string().required(),
      //           icon: Joi.string()
      //             .uri()
      //             .allow(null)
      //             .required(),
      //           public: Joi.boolean()
      //             .valid()
      //             .required(),
      //           ownerId: Joi.string()
      //             .uuid()
      //             .required(),
      //           ...playerStatusJoi,
      //           created_at: Joi.date()
      //             .iso()
      //             .required(),
      //           firstMessageId: Joi.string()
      //             .uuid()
      //             .valid(null)
      //             .required(),
      //           lastMessageId: Joi.string()
      //             .uuid()
      //             .valid(null)
      //             .required(),
      //           lastMessageAt: Joi.string()
      //             .uuid()
      //             .valid(null)
      //             .required(),
      //           firstPostId: Joi.string()
      //             .uuid()
      //             .valid(null)
      //             .required(),
      //           lastPostId: Joi.string()
      //             .uuid()
      //             .valid(null)
      //             .required(),
      //           lastPostAt: Joi.date()
      //             .iso()
      //             .valid(null)
      //             .required(),
      //           members: Joi.array()
      //             .items(Joi.string().uuid())
      //             .length(1)
      //             .required(),
      //           admins: Joi.array()
      //             .length(1)
      //             .required(),
      //           banned: Joi.array()
      //             .length(0)
      //             .required()
      //         }),
      //         users: Joi.object()
      //           .length(1)
      //           .required(),
      //         messages: Joi.array()
      //           .length(0)
      //           .required(),
      //         posts: Joi.array()
      //           .length(0)
      //           .required(),
      //         comments: Joi.object().required()
      //       })
      //       .required()
      //       .label("addChannelResponse")
      //   }
      // }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { name, description, icon, public } = req.payload;
      const {
        channel,
        users,
        messages,
        posts,
        comments
      } = await ChannelService.addChannel({
        userId,
        name,
        description,
        public,
        icon
      });

      publisher({
        type: WS_EVENTS.USER.SUBSCRIBE_CHANNEL,
        channelId: channel.id,
        userId,
        payload: { userId, channelId: channel.id, type: "channel" }
      });

      return res
        .response({
          channelId: channel.id,
          channel,
          users,
          messages,
          posts,
          comments
        })
        .code(201);
    }
  },
  {
    method: "POST",
    path: "/rooms",
    options: {
      description: "Adds room",
      tags: ["api"],
      validate: {
        payload: Joi.object()
          .keys({
            userIds: Joi.array()
              .items(
                Joi.string()
                  .uuid()
                  .required()
              )
              .min(2)
              .max(7)
              .unique()
              .required()
          })
          .required()
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { userIds } = req.payload;
      const { channel, users, messages } = await ChannelService.addRoom({
        userId,
        userIds
      });

      const payload = { channelId: channel.id, channel, users, messages };
      publisher({
        type: WS_EVENTS.USER.SUBSCRIBE_CHANNEL,
        channelId: channel.id,
        userId,
        payload: { ...payload, type: "group" }
      });
      userIds.forEach(uid => {
        publisher({
          type: WS_EVENTS.USER.ADD_CHANNEL,
          channelId: channel.id,
          userId: uid,
          payload: { ...payload, type: "group" }
        });
      });

      return res.response(payload).code(201);
    }
  },
  {
    method: "GET",
    path: "/channel",
    options: {
      description: "Gets channel",
      tags: ["api"],
      validate: {
        query: Joi.object()
          .keys({
            channelId: Joi.string()
              .uuid()
              .required(),
            leave: Joi.string()
              .uuid()
              .optional()
          })
          .required()
      }
    },
    // Joi.object().keys({ users: Joi.array().items(mySchema) })
    // multiple response schemas
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId, leave } = req.query;
      const channelInfo = await ChannelService.getChannel({
        userId,
        channelId
      });

      await redis.sadd(`viewers:${channelId}`, userId);

      let user = await UserService.getUser({ userId });

      user = {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      };

      publisher({
        type: WS_EVENTS.USER_CHANNEL.JOIN_CHANNEL,
        userId,
        channelId,
        initiator: userId,
        payload: { userId, channelId, user, type: channelInfo.type }
      });

      if (leave) {
        const chanInfo = await ChannelService.getChannel({
          userId,
          channelId: leave
        });

        await redis.srem(`viewers:${leave}`, userId);

        publisher({
          type: WS_EVENTS.USER_CHANNEL.LEAVE_CHANNEL,
          userId,
          channelId: leave,
          initiator: userId,
          payload: { userId, channelId: leave, type: chanInfo.type }
        });
      }

      return { channelId, ...channelInfo };
    }
  },
  {
    method: "POST",
    path: "/visitAndLeave",
    options: {
      description: "Visits and leaves channel",
      tags: ["api"],
      validate: {
        payload: Joi.object()
          .keys({
            visit: Joi.string()
              .uuid()
              .optional(),
            leave: Joi.string()
              .uuid()
              .optional()
          })
          .or("visit", "leave")
          .required()
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { visit, leave } = req.payload;

      if (visit) {
        const channelInfo = await ChannelService.getChannel({
          userId,
          channelId: visit
        });

        await redis.sadd(`viewers:${visit}`, userId);

        let user = await UserService.getUser({ userId });

        user = {
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar
        };

        publisher({
          type: WS_EVENTS.USER_CHANNEL.JOIN_CHANNEL,
          userId,
          channelId: visit,
          initiator: userId,
          payload: { userId, channelId: visit, user, type: channelInfo.type }
        });
      }

      if (leave) {
        const channelInfo = await ChannelService.getChannel({
          userId,
          channelId: leave
        });

        await redis.srem(`viewers:${leave}`, userId);

        publisher({
          type: WS_EVENTS.USER_CHANNEL.LEAVE_CHANNEL,
          userId,
          channelId: leave,
          initiator: userId,
          payload: { userId, channelId: leave, type: channelInfo.type }
        });
      }

      return {};
    }
  },
  {
    method: "PUT",
    path: "/{channelId}",
    options: {
      description: "Updates channel",
      tags: ["api"],
      payload: { multipart: { output: "annotated" } },
      plugins: {
        "hapi-swagger": {
          payloadType: "form"
        }
      },
      validate: {
        params: Joi.object()
          .keys({
            channelId: Joi.string()
              .uuid()
              .required()
          })
          .required(),
        payload: Joi.object()
          .keys({
            name: Joi.string()
              .min(3)
              .max(20)
              .optional(),
            description: Joi.string()
              .min(0)
              .max(150)
              .optional(),
            public: Joi.boolean().optional(),
            icon: Joi.optional().meta({ swaggerType: "file" }),
            removeIcon: Joi.boolean().optional()
          })
          .oxor("icon", "removeIcon")
          .required()
      },
      response: {
        status: {
          201: Joi.object()
            .keys({
              channelId: Joi.string()
                .uuid()
                .required(),
              channel: Joi.object().keys({
                id: Joi.string()
                  .uuid()
                  .required(),
                type: Joi.string()
                  .valid("channel")
                  .required(),
                name: Joi.string().required(),
                description: Joi.string().required(),
                icon: Joi.string()
                  .uri()
                  .allow(null)
                  .required(),
                public: Joi.boolean()
                  .valid()
                  .required(),
                owner_id: Joi.string()
                  .uuid()
                  .required(),
                created_at: Joi.date()
                  .iso()
                  .required()
              })
            })
            .required()
            .label("updateChannelResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      const channel = await ChannelService.updateChannel({
        userId,
        channelId,
        ...req.payload
      });

      const payload = { channelId, updatedChannel: channel };
      publisher({
        type: WS_EVENTS.CHANNEL.UPDATE_CHANNEL,
        channelId,
        initiator: userId,
        payload
      });

      return payload;
    }
  },
  {
    method: "DELETE",
    path: "/{channelId}",
    options: {
      description: "Deletes channel",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            channelId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      },
      response: {
        status: {
          200: Joi.object()
            .keys({
              channelId: Joi.string()
                .uuid()
                .required()
            })
            .required()
            .label("deleteChannelResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      await ChannelService.deleteChannel({ userId, channelId });
      publisher({
        type: WS_EVENTS.CHANNEL.DELETE_CHANNEL,
        channelId,
        initiator: userId,
        payload: { channelId }
      });
      return { channelId };
    }
  },
  {
    method: "PUT",
    path: "/{channelId}/play",
    options: {
      description: "Sets playing status",
      tags: ["api"],
      payload: { multipart: { output: "annotated" } },
      plugins: {
        "hapi-swagger": {
          payloadType: "form"
        }
      },
      validate: playerValidation,
      response: {
        status: {
          201: Joi.object()
            .keys(playerReturnKeys)
            .required()
            .label("setPlaying")
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      const playerStatus = await ChannelService.updatePlayerStatus({
        userId,
        channelId,
        ...req.payload,
        status: "Playing"
      });

      const payload = { channelId, updatedChannel: playerStatus };

      publisher({
        type: WS_EVENTS.CHANNEL.UPDATE_CHANNEL,
        channelId,
        initiator: userId,
        payload
      });

      return payload;
    }
  },
  {
    method: "PUT",
    path: "/{channelId}/pause",
    options: {
      description: "Sets paused status",
      tags: ["api"],
      payload: { multipart: { output: "annotated" } },
      plugins: {
        "hapi-swagger": {
          payloadType: "form"
        }
      },
      validate: playerValidation,
      response: {
        status: {
          201: Joi.object()
            .keys(playerReturnKeys)
            .required()
            .label("setPaused")
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      const playerStatus = await ChannelService.updatePlayerStatus({
        userId,
        channelId,
        ...req.payload,
        status: "Paused"
      });

      const payload = { channelId, updatedChannel: playerStatus };

      publisher({
        type: WS_EVENTS.CHANNEL.UPDATE_CHANNEL,
        channelId,
        initiator: userId,
        payload
      });

      return payload;
    }
  },
  {
    method: "PUT",
    path: "/{channelId}/skip",
    options: {
      description: "Skips video player to new location",
      tags: ["api"],
      payload: { multipart: { output: "annotated" } },
      plugins: { "hapi-swagger": { payloadType: "form" } },
      validate: playerValidation,
      response: {
        status: {
          201: Joi.object()
            .keys(playerReturnKeys)
            .required()
            .label("skip")
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      const playerStatus = await ChannelService.updatePlayerStatus({
        userId,
        channelId,
        ...req.payload
      });
      return { channelId, updatedChannel: playerStatus };
    }
  },
  {
    method: "GET",
    path: "/discover",
    options: {
      description: "Discover channels",
      tags: ["api"]
      // response: {
      //   status: {
      //     200: loginResponseSchema
      //   }
      // }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const discoveredChannels = await ChannelService.discoverChannels({
        userId
      });

      return discoveredChannels;
    }
  },
  {
    method: "GET",
    path: "/trending",
    options: {
      description: "Trending channels",
      tags: ["api"]
      // response: {
      //   status: {
      //     200: loginResponseSchema
      //   }
      // }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const trendingChannels = await ChannelService.trendingChannels({
        userId
      });

      return trendingChannels;
    }
  },
  {
    method: "GET",
    path: "/following",
    options: {
      description: "Following channels",
      tags: ["api"]
      // response: {
      //   status: {
      //     200: loginResponseSchema
      //   }
      // }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const followingChannels = await ChannelService.followingChannels({
        userId
      });

      return followingChannels;
    }
  },
  {
    method: "GET",
    path: "/search",
    options: {
      description: "Searches channel",
      tags: ["api"],
      validate: {
        query: Joi.object()
          .keys({
            channelName: Joi.string()
              .min(2)
              .max(50)
              .required(),
            page: Joi.number()
              .integer()
              .positive()
              .min(1)
              .default(1)
              .optional()
          })
          .required()
      }
      // response: {
      //   status: {
      //     200: Joi.array()
      //       .required()
      //       .label("searchChannelResponse")
      //   }
      // }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelName, page } = req.query;
      const channels = await ChannelService.searchChannels({
        channelName,
        page,
        userId
      });

      return channels;
    }
  }
];

const ChannelController = {
  name: "ChannelController",
  version: "1.0.0",
  async register(server, options) {
    server.route(controllers);
  }
};

module.exports = ChannelController;
