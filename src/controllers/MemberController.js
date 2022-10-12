const Joi = require("@hapi/joi");
const { WS_EVENTS } = require("../config/constants");
const publisher = require("../config/publisher");
const MemberService = require("../services/MemberService");
// const ChannelService = require("../services/ChannelService");

// TODO: Different endpoint for leaving channels and leaving rooms

// TODO: room invite joins endpoint not done

const controllers = [
  {
    method: "POST",
    path: "/{channelId}",
    options: {
      description: "Adds member",
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
          201: Joi.object()
            .keys({
              channelId: Joi.string()
                .uuid()
                .required(),
              userId: Joi.string()
                .uuid()
                .required(),
              type: Joi.string()
                .valid("channel")
                .required(),
              user: Joi.object()
                .keys({
                  username: Joi.string().required(),
                  firstName: Joi.string().required(),
                  lastName: Joi.string().required(),
                  avatar: Joi.string()
                    .allow(null)
                    .required()
                })
                .required()
            })
            .required()
            .label("addMemberResponse")
        }
      }
    },
    async handler(req, res) {
      // no need to query for type, assume the type to be channel here
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      const { user, type } = await MemberService.addMember({
        channelId,
        userId
      });
      publisher({
        type: WS_EVENTS.CHANNEL.ADD_MEMBER,
        channelId,
        initiator: userId,
        payload: { userId, channelId, user, type }
      });
      return res.response({ channelId, userId, user, type }).code(201);
    }
  },
  {
    method: "POST",
    path: "/{channelId}/room",
    options: {
      description: "Adds room members",
      tags: ["api"],
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
            userIds: Joi.array()
              .items(
                Joi.string()
                  .uuid()
                  .required()
              )
              .min(1)
              .max(7)
              .unique()
              .required()
          })
          .required()
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      const { userIds } = req.payload;

      const newMembers = await MemberService.addRoomMembers({
        userId,
        channelId,
        userIds
      });

      // { channel, users, messages }
      // const { user, type } = newMembers;

      // publisher({
      //   type: CHANNEL_EVENTS.WS_ADD_MEMBERS,
      //   channelId,
      //   initiator: userId,
      //   payload: {
      //     channelId,
      //     userIds,
      //     users
      //   }
      // });

      // userIds.forEach(uid => {
      //   publisher({
      //     type: USER_CHANNEL_EVENTS.WS_ADD_CHANNEL,
      //     channelId,
      //     userId: uid,
      //     payload: {
      //       channel,
      //       users,
      //       channelId,
      //       type: "group"
      //     }
      //   });
      // });

      return res.response(newMembers).code(201);
      // return res.response({ userId, channelId, user, type }).code(201);
    }
  },
  {
    method: "DELETE",
    path: "/{channelId}",
    options: {
      description: "Deletes member",
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
                .required(),
              userId: Joi.string()
                .uuid()
                .required()
            })
            .required()
            .label("deleteMemberResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      await MemberService.deleteMember({ userId, channelId });

      publisher({
        type: WS_EVENTS.CHANNEL.DELETE_MEMBER,
        channelId,
        initiator: userId,
        payload: { userId, channelId }
      });

      return { channelId, userId };
    }
  },
  {
    method: "POST",
    path: "/{channelId}/admins",
    options: {
      description: "Adds admin",
      tags: ["api"],
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
            adminId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      },
      response: {
        status: {
          201: Joi.object()
            .keys({
              channelId: Joi.string()
                .uuid()
                .required(),
              userId: Joi.string()
                .uuid()
                .required(),
              admin: Joi.boolean()
                .valid(true)
                .required(),
              banned: Joi.boolean()
                .valid(false)
                .required()
            })
            .required()
            .label("addAdminResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: fromUser } = req.auth.credentials;
      const { channelId } = req.params;
      const { adminId: toUser } = req.payload;
      const memberInfo = await MemberService.addAdmin({
        channelId,
        fromUser,
        toUser
      });
      publisher({
        type: WS_EVENTS.CHANNEL.ADD_ADMIN,
        channelId,
        initiator: fromUser,
        payload: { channelId, userId: toUser }
      });
      return res.response({ channelId, ...memberInfo }).code(201);
    }
  },
  {
    method: "DELETE",
    path: "/{channelId}/admins/{adminId}",
    options: {
      description: "Deletes admin",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            channelId: Joi.string()
              .uuid()
              .required(),
            adminId: Joi.string()
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
                .required(),
              userId: Joi.string()
                .uuid()
                .required(),
              admin: Joi.boolean()
                .valid(false)
                .required(),
              banned: Joi.boolean()
                .valid(false)
                .required()
            })
            .required()
            .label("deleteAdminResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: fromUser } = req.auth.credentials;
      const { channelId, adminId: toUser } = req.params;
      const memberInfo = await MemberService.deleteAdmin({
        channelId,
        fromUser,
        toUser
      });
      // publisher({
      //   type: CHANNEL_EVENTS.WS_DELETE_ADMIN,
      //   channelId,
      //   initiator: fromUser,
      //   payload: { channelId, userId: toUser }
      // });
      return { channelId, ...memberInfo };
    }
  },
  {
    method: "POST",
    path: "/{channelId}/bans",
    options: {
      description: "Adds ban",
      tags: ["api"],
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
            bannedId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      },
      response: {
        status: {
          201: Joi.object()
            .keys({
              channelId: Joi.string()
                .uuid()
                .required(),
              userId: Joi.string()
                .uuid()
                .required(),
              admin: Joi.boolean()
                .valid(false)
                .required(),
              banned: Joi.boolean()
                .valid(true)
                .required()
            })
            .required()
            .label("addBanResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: fromUser } = req.auth.credentials;
      const { channelId } = req.params;
      const { bannedId: toUser } = req.payload;
      const memberInfo = await MemberService.addBan({
        channelId,
        fromUser,
        toUser
      });
      // publisher({
      //   type: CHANNEL_EVENTS.WS_ADD_BAN,
      //   channelId,
      //   initiator: fromUser,
      //   payload: { channelId, userId: toUser }
      // });
      return res.response({ channelId, ...memberInfo }).code(201);
    }
  },
  {
    method: "DELETE",
    path: "/{channelId}/bans/{bannedId}",
    options: {
      description: "Deletes ban",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            channelId: Joi.string()
              .uuid()
              .required(),
            bannedId: Joi.string()
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
                .required(),
              userId: Joi.string()
                .uuid()
                .required(),
              admin: Joi.boolean()
                .valid(false)
                .required(),
              banned: Joi.boolean()
                .valid(false)
                .required()
            })
            .required()
            .label("deleteBanResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: fromUser } = req.auth.credentials;
      const { channelId, bannedId: toUser } = req.params;
      const memberInfo = await MemberService.deleteBan({
        channelId,
        fromUser,
        toUser
      });
      // publisher({
      //   type: CHANNEL_EVENTS.WS_DELETE_BAN,
      //   channelId,
      //   initiator: fromUser,
      //   payload: { channelId, userId: toUser }
      // });
      return { channelId, ...memberInfo };
    }
  }
];

const MemberController = {
  name: "MemberController",
  version: "1.0.0",
  async register(server, options) {
    server.route(controllers);
  }
};

module.exports = MemberController;
