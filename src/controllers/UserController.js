const Joi = require("@hapi/joi");
const { WS_EVENTS } = require("../config/constants");
const UserService = require("../services/UserService");
const publisher = require("../config/publisher");
const { playerStatusJoi } = require("../helpers/commonJois");

const basicUserSchema = Joi.object().keys({
  id: Joi.string()
    .uuid()
    .required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  username: Joi.string().required(),
  avatar: Joi.string()
    .uri()
    .allow(null)
    .required()
});

const controllers = [
  {
    method: "POST",
    path: "/",
    options: {
      auth: false,
      description: "Register user",
      tags: ["api"],
      validate: {
        payload: Joi.object()
          .keys({
            firstName: Joi.string()
              .min(1)
              .max(50)
              .required()
              .example("first"),
            lastName: Joi.string()
              .min(1)
              .max(50)
              .required()
              .example("last"),
            username: Joi.string()
              .min(3)
              .max(30)
              .required()
              .example("username"),
            dateOfBirth: Joi.date()
              .iso()
              .max(new Date(new Date() - 1000 * 60 * 60 * 24 * 365 * 13))
              .required()
              .example("1980-01-01"),
            email: Joi.string()
              .email()
              .required()
              .example("email@gmail.com"),
            password: Joi.string()
              .min(6)
              .regex(/[a-z]/)
              .regex(/[A-Z]/)
              .regex(/\d+/)
              .required()
              .example("PassW0rd")
          })
          .required()
          .label("addUserRequest")
      },
      response: {
        status: {
          201: Joi.object()
            .keys({
              id: Joi.string()
                .uuid()
                .required(),
              firstName: Joi.string().required(),
              lastName: Joi.string().required(),
              username: Joi.string().required(),
              dateOfBirth: Joi.date()
                .iso()
                .required(),
              avatar: Joi.string()
                .valid(null)
                .required(),
              email: Joi.string()
                .email()
                .required(),
              emailVerified: Joi.boolean()
                .valid(false)
                .required(),
              createdAt: Joi.date()
                .iso()
                .required(),
              newUser: Joi.boolean()
                .valid(true)
                .required()
            })
            .required()
            .label("addUserResponse")
        }
      }
    },
    async handler(req, res) {
      const newUser = await UserService.addUser(req.payload);
      return res.response(newUser).code(201);
    }
  },
  {
    method: "GET",
    path: "/{userId}",
    options: {
      description: "Gets user",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            userId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      },
      response: {
        status: {
          201: basicUserSchema.required().label("getUserResponse")
        }
      }
    },
    async handler(req, res) {
      const { userId } = req.params;
      const user = await UserService.getUser({ userId });
      return {
        id: userId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatar: user.avatar
      };
    }
  },
  {
    method: "PUT",
    path: "/",
    options: {
      description: "Updates user",
      tags: ["api"],
      payload: { multipart: { output: "annotated" } },
      plugins: { "hapi-swagger": { payloadType: "form" } },
      validate: {
        payload: Joi.object()
          .keys({
            firstName: Joi.string()
              .min(1)
              .max(50)
              .optional()
              .example("first"),
            lastName: Joi.string()
              .min(1)
              .max(50)
              .optional()
              .example("last"),
            dateOfBirth: Joi.date()
              .iso()
              .max(new Date(new Date() - 1000 * 60 * 60 * 24 * 365 * 13))
              .optional()
              .example("1990-01-01"),
            email: Joi.string()
              .email()
              .optional()
              .example("email123@gmail.com"),
            password: Joi.string()
              .optional()
              .example("oldPassword123"),
            newPassword: Joi.string()
              .regex(/[a-z]/)
              .regex(/[A-Z]/)
              .regex(/\d+/)
              .disallow(Joi.ref("password"))
              .optional()
              .example("newPassword"),
            avatar: Joi.optional().meta({ swaggerType: "file" }),
            removeAvatar: Joi.boolean().optional()
          })
          .with("newPassword", "password")
          .oxor("avatar", "removeAvatar")
          .required()
        // Don't allow only password to be passed
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const updatedUser = await UserService.updateUser({
        userId,
        ...req.payload
      });
      return updatedUser;
    }
  },
  {
    method: "DELETE",
    path: "/",
    options: {
      description: "Deletes user",
      tags: ["api"]
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      await UserService.deleteUser({ userId });
      req.yar.clear("auth");
      return res.response({}).code(204);
    }
  },
  {
    method: "GET",
    path: "/",
    options: {
      description: "Searches users",
      tags: ["api"],
      validate: {
        query: Joi.object()
          .keys({
            username: Joi.string()
              .min(1)
              .required()
          })
          .required()
      },
      response: {
        status: {
          200: Joi.array()
            .items(basicUserSchema)
            .required()
            .label("searchUsersResponse")
        }
      }
    },
    async handler(req, res) {
      const { username } = req.query;
      const users = await UserService.searchUsers({ username });
      return users;
    }
  },
  {
    method: "POST",
    path: "/friendRequests",
    options: {
      description: "Add friend request",
      tags: ["api"],
      validate: {
        payload: Joi.object()
          .keys({
            requesteeId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      },
      response: {
        status: {
          201: Joi.object()
            .keys({
              userId: Joi.string()
                .uuid()
                .required(),
              user: basicUserSchema.required()
            })
            .required()
            .label("addFriendRequestResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: fromUser } = req.auth.credentials;
      const { requesteeId: toUser } = req.payload;
      const user = await UserService.addFriendRequest({ fromUser, toUser });
      publisher({
        type: WS_EVENTS.USER.ADD_RECEIVED_FRIEND_REQUEST,
        userId: toUser,
        payload: { userId: fromUser, user }
      });
      return res.response({ userId: toUser, user }).code(201);
    }
  },
  {
    method: "DELETE",
    path: "/friendRequests/{requesteeId}/cancel",
    options: {
      description: "Cancel sent friend request",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            requesteeId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      },
      response: {
        status: {
          200: Joi.object()
            .keys({
              userId: Joi.string()
                .uuid()
                .required()
            })
            .label("deleteFriendRequestResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: fromUser } = req.auth.credentials;
      const { requesteeId: toUser } = req.params;
      await UserService.deleteFriendRequest({
        userId1: fromUser,
        userId2: toUser
      });
      publisher({
        type: WS_EVENTS.USER.DELETE_RECEIVED_FRIEND_REQUEST,
        userId: toUser,
        payload: { userId: fromUser }
      });
      return { userId: toUser };
    }
  },
  {
    method: "DELETE",
    path: "/friendRequests/{requesterId}/reject",
    options: {
      description: "Rejects friend request",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            requesterId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      },
      response: {
        status: {
          200: Joi.object()
            .keys({
              userId: Joi.string()
                .uuid()
                .required()
            })
            .label("deleteFriendRequestResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: toUser } = req.auth.credentials;
      const { requesterId: fromUser } = req.params;
      await UserService.deleteFriendRequest({
        userId1: fromUser,
        userId2: toUser
      });
      publisher({
        type: WS_EVENTS.USER.DELETE_SENT_FRIEND_REQUEST,
        userId: fromUser,
        payload: { userId: toUser }
      });
      return { userId: fromUser };
    }
  },
  {
    method: "POST",
    path: "/friends",
    options: {
      description: "Adds friend",
      tags: ["api"],
      validate: {
        payload: Joi.object()
          .keys({
            requesterId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      },
      response: {
        status: {
          201: Joi.object()
            .keys({
              userId: Joi.string()
                .uuid()
                .required(),
              channelId: Joi.string()
                .uuid()
                .required(),
              channel: Joi.object()
                .keys({
                  id: Joi.string()
                    .uuid()
                    .required(),
                  type: Joi.string().required(),
                  name: Joi.string()
                    .valid(null)
                    .required(),
                  public: Joi.boolean()
                    .valid(false)
                    .required(),
                  ...playerStatusJoi,
                  createdAt: Joi.date()
                    .iso()
                    .required(),
                  firstMessageId: Joi.string()
                    .valid(null)
                    .required(),
                  lastMessageId: Joi.string()
                    .valid(null)
                    .required(),
                  lastMessageAt: Joi.string()
                    .valid(null)
                    .required(),
                  members: Joi.array()
                    .items(
                      Joi.string()
                        .uuid()
                        .required()
                    )
                    .length(2)
                    .required()
                })
                .required(),
              users: Joi.object()
                .length(2)
                .required(),
              messages: Joi.array()
                .length(0)
                .required()
            })
            .required()
            .label("addFriendResponse")
        }
      }
    },
    async handler(req, res) {
      // make sure not already friends
      const { id: fromUser } = req.auth.credentials;
      const { requesterId: toUser } = req.payload;
      const { channel, users, messages } = await UserService.addFriend({
        userId1: fromUser,
        userId2: toUser
      });
      publisher({
        type: WS_EVENTS.USER.SUBSCRIBE_CHANNEL,
        userId: toUser,
        channelId: channel.id,
        payload: {
          userId: fromUser,
          channelId: channel.id,
          type: "friend"
        }
      });
      // Sends event to user who accepts the friendship
      publisher({
        type: WS_EVENTS.USER.ADD_FRIEND,
        userId: fromUser,
        channelId: channel.id,
        payload: {
          userId: toUser,
          channelId: channel.id,
          type: "friend",
          channel,
          users,
          messages
        }
      });
      // Sends event to user who requested the friendship
      publisher({
        type: WS_EVENTS.USER.ADD_FRIEND,
        userId: toUser,
        channelId: channel.id,
        payload: {
          userId: fromUser,
          channelId: channel.id,
          type: "friend",
          channel,
          users,
          messages
        }
      });
      return res
        .response({
          userId: toUser,
          channelId: channel.id,
          channel,
          users,
          messages
        })
        .code(201);
    }
  },
  {
    method: "DELETE",
    path: "/friends/{friendId}",
    options: {
      description: "Deletes friend",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            friendId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      },
      response: {
        status: {
          200: Joi.object()
            .keys({
              userId: Joi.string()
                .uuid()
                .required(),
              channelId: Joi.string()
                .uuid()
                .required()
            })
            .label("deleteFriendResponse")
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { friendId } = req.params;
      const deletedChannel = await UserService.deleteFriend({
        userId1: userId,
        userId2: friendId
      });
      publisher({
        type: WS_EVENTS.USER_CHANNEL.UNFRIEND,
        userId: friendId,
        channelId: deletedChannel.id,
        payload: { userId, channelId: deletedChannel.id }
      });
      return { userId: friendId, channelId: deletedChannel.id };
    }
  },
  {
    method: "POST",
    path: "/blocks",
    options: {
      description: "Adds block",
      tags: ["api"],
      validate: {
        payload: Joi.object()
          .keys({
            blockedId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      }
    },
    async handler(req, res) {
      const { id: fromUser } = req.auth.credentials;
      const { blockedId: toUser } = req.payload;

      const blockedInfo = await UserService.addBlock({ fromUser, toUser });
      if (blockedInfo.isFriend) {
        publisher({
          type: WS_EVENTS.USER_CHANNEL.BLOCK_FRIEND,
          channelId: blockedInfo.channelId,
          userId: toUser,
          payload: { userId: fromUser, channelId: blockedInfo.channelId }
        });
      } else {
        publisher({
          type: WS_EVENTS.USER.ADD_BLOCKER,
          userId: toUser,
          payload: { userId: fromUser }
        });
      }

      return res
        .response({
          userId: toUser,
          channelId: blockedInfo.channelId,
          user: blockedInfo.user
        })
        .code(201);
    }
  },
  {
    method: "DELETE",
    path: "/blocks/{blockedId}",
    options: {
      description: "Deletes block",
      tags: ["api"],
      validate: {
        params: Joi.object()
          .keys({
            blockedId: Joi.string()
              .uuid()
              .required()
          })
          .required()
      }
    },
    async handler(req, res) {
      const { id: fromUser } = req.auth.credentials;
      const { blockedId: toUser } = req.params;

      await UserService.deleteBlock({ fromUser, toUser });
      // publisher({
      //   type: USER_EVENTS.WS_DELETE_BLOCKER,
      //   userId: toUser,
      //   payload: { userId: fromUser }
      // });

      return { userId: toUser };
    }
  }
];

const UserController = {
  name: "UserController",
  version: "1.0.0",
  async register(server, options) {
    server.route(controllers);
  }
};

module.exports = UserController;
