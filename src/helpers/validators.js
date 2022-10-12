const Joi = require("@hapi/joi");

const JoiId = Joi.string().uuid();

const JoiIdArray = Joi.array()
  .items(JoiId)
  .unique();

Joi.string().uuid();

const JoiFirstOrLastName = Joi.string();
const JoiUsername = Joi.string();
const JoiChannelName = Joi.string()
  .min(3)
  .max(20);
const JoiChannelDescription = Joi.string()
  .min(1)
  .max(150);
const JoiChannelType = Joi.string().valid("self", "friend", "group", "channel");

const JoiAvatar = Joi.string()
  .uri()
  .allow(null);

const JoiDate = Joi.date().iso();

const JoiUpload = Joi.string()
  .allow(null)
  .default(null);

const JoiContentMessage = Joi.string()
  .min(1)
  .max(2000);

const JoiContentPost = Joi.string()
  .min(1)
  .max(20000);

const JoiContentComment = Joi.string()
  .min(1)
  .max(2000);

const JoiAuthor = Joi.object().keys({
  id: JoiId.required(),
  username: JoiUsername.required(),
  avatar: JoiAvatar.required()
});

const JoiUserObject = Joi.object().keys({
  id: JoiId.required(),
  firstName: JoiFirstOrLastName.required(),
  lastName: JoiFirstOrLastName.required(),
  username: JoiUsername.required(),
  avatar: JoiAvatar.required()
});

const JoiUsersObject = Joi.object().pattern(
  JoiId.required(),
  JoiUserObject.required()
);

const JoiMessageObject = Joi.object().keys({
  id: JoiId.required(),
  channelId: JoiId.required(),
  userId: JoiId.required(),
  content: JoiContentMessage.required(),
  upload: JoiUpload.required(),
  createdAt: JoiDate.required(),
  author: JoiAuthor.required()
});

const JoiMessagesObject = Joi.object().pattern(
  JoiId.required(),
  JoiMessageObject.required()
);

const JoiPostObject = Joi.object().keys({
  id: JoiId.required(),
  channelId: JoiId.required(),
  userId: JoiId.required(),
  content: JoiContentPost.required(),
  upload: JoiUpload.required(),
  createdAt: JoiDate.required(),
  author: JoiAuthor.required(),
  liked: Joi.boolean().required(),
  likeCount: Joi.number()
    .integer()
    .min(0)
    .required(),
  commentCount: Joi.number()
    .integer()
    .min(0)
    .required(),
  selfCommentCount: Joi.number()
    .integer()
    .min(0)
    .required(),
  firstCommentId: JoiId.allow(null).required(),
  lastCommentId: JoiId.allow(null).required(),
  comments: JoiIdArray.required()
});

const JoiPostsObject = Joi.object().pattern(
  JoiId.required(),
  JoiPostObject.required()
);

const JoiPostLikeObject = Joi.object().keys({
  postId: JoiId.required(),
  userId: JoiId.required(),
  channelId: JoiId.required()
});

const JoiCommentObject = Joi.object().keys({
  id: JoiId.required(),
  postId: JoiId.required(),
  channelId: JoiId.required(),
  userId: JoiId.required(),
  content: JoiContentComment.required(),
  createdAt: JoiDate.required(),
  author: JoiAuthor.required(),
  liked: Joi.boolean().required(),
  likeCount: Joi.number()
    .integer()
    .min(0)
    .required()
});

const JoiCommentsObject = Joi.object().pattern(
  JoiId.required(),
  JoiCommentObject.required()
);

const JoiCommentLikeObject = Joi.object().keys({
  commentId: JoiId.required(),
  postId: JoiId.required(),
  channelId: JoiId.required(),
  userId: JoiId.required()
});

const JoiChannelObject = Joi.object().keys({
  id: JoiId.required(),
  type: JoiChannelType.required(),
  name: JoiChannelName.required(),
  description: JoiChannelDescription.required(),
  icon: JoiAvatar.required(),
  public: Joi.boolean().required(),
  ownerId: JoiId.required(),
  createdAt: JoiDate.required(),
  firstMessageId: JoiId.allow(null).required(),
  lastMessageId: JoiId.allow(null).required(),
  lastMessageAt: JoiDate.allow(null).required(),
  firstPostId: JoiId.allow(null).required(),
  lastPostId: JoiId.allow(null).required(),
  lastPostAt: JoiDate.allow(null).required(),
  status: Joi.string().required(),
  queueStartPosition: Joi.number().required(),
  videoStartTime: Joi.number().required(),
  clockStartTime: JoiDate.required(),
  members: JoiIdArray.required(),
  admins: JoiIdArray.required(),
  banned: JoiIdArray.required(),
  messages: JoiIdArray.required(),
  posts: JoiIdArray.required(),
  queue: Joi.array().required()
  // queue: JoiIdArray.required()
});

const JoiChannelsObject = Joi.object().pattern(
  JoiId.required(),
  JoiChannelObject.required()
);

module.exports = {
  channels: {
    "POST /": {
      req: {
        payload: Joi.object()
          .keys({
            name: JoiChannelName.required(),
            description: JoiChannelDescription.required(),
            icon: Joi.optional().meta({ swaggerType: "file" }),
            public: Joi.boolean()
              .default(true)
              .required()
          })
          .required()
      },
      res: Joi.object()
        .keys({
          channelId: JoiId.required(),
          channel: JoiChannelObject.required(),
          users: JoiId.required(),
          messages: JoiMessagesObject.allow(null).required(),
          posts: JoiPostsObject.allow(null).required(),
          comments: JoiCommentsObject.allow(null).required()
        })
        .required()
    },
    "GET /channel": {
      req: {
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
      },
      res: Joi.object()
        .keys({
          channelId: JoiId.required(),
          // JoiChannelAdminObject, JoiChannelPublicObject, ...etc
          channel: JoiChannelObject.required(),
          messages: JoiChannelObject.required(),
          posts: JoiChannelObject.required(),
          comments: JoiChannelObject.required(),
          type: JoiChannelType.required(),
          isPublic: Joi.boolean().required(),
          isOwner: Joi.boolean().required(),
          isAdmin: Joi.boolean().required(),
          isMember: Joi.boolean().required(),
          isBanned: Joi.boolean().required()
        })
        .required()
    }
  },
  messages: {
    "POST /": {
      req: {
        payload: Joi.object()
          .keys({
            channelId: JoiId.required(),
            content: JoiContentMessage.required(),
            upload: JoiUpload.optional()
          })
          .required()
      },
      res: Joi.object()
        .keys({
          message: JoiMessageObject.required(),
          channelId: JoiId.required(),
          userId: JoiId.required()
        })
        .required()
        .label("addMessageResponse")
    },
    "GET /{channelId}": {
      req: {
        params: Joi.object()
          .keys({
            channelId: JoiId.required()
          })
          .required(),
        query: Joi.object()
          .keys({
            afterMessageId: JoiId.optional(),
            beforeMessageId: JoiId.optional()
          })
          .optional()
      },
      res: Joi.object()
        .keys({
          messages: JoiMessagesObject.required(),
          channelId: JoiId.required(),
          afterMessageId: JoiId.optional(),
          beforeMessageId: JoiId.optional()
        })
        .required()
        .label("getMessagesResponse")
    },
    "/{messageId}": {
      req: {
        params: Joi.object()
          .keys({
            messageId: JoiId.required()
          })
          .required()
      },
      res: Joi.object()
        .keys({
          messageId: JoiId.required(),
          channelId: JoiId.required(),
          firstMessageId: JoiId.required(),
          lastMessageId: JoiId.required(),
          lastMessageAt: JoiDate.required()
        })
        .required()
    }
  },
  posts: {
    "POST /": {
      req: {
        payload: Joi.object()
          .keys({
            channelId: JoiId.required(),
            content: JoiContentPost.required(),
            upload: JoiUpload.optional()
          })
          .required()
      },
      res: Joi.object()
        .keys({
          post: JoiPostObject.required(),
          channelId: JoiId.required()
        })
        .required()
    },
    "GET /{channelId}": {
      req: {
        params: Joi.object()
          .keys({
            channelId: JoiId.required()
          })
          .required(),
        query: Joi.object()
          .keys({
            afterPostId: JoiId.optional(),
            beforePostId: JoiId.optional()
          })
          .optional()
      },
      res: Joi.object()
        .keys({
          posts: JoiPostsObject.allow(null).required(),
          comments: JoiIdArray.allow(null).required(),
          channelId: JoiId.required(),
          afterPostId: JoiId.optional(),
          beforePostId: JoiId.optional()
        })
        .required()
    },
    "DELETE /{postId}": {
      req: {
        params: Joi.object()
          .keys({
            postId: JoiId.required()
          })
          .required()
      },
      res: Joi.object()
        .keys({
          postId: JoiId.required(),
          channelId: JoiId.required(),
          firstPostId: JoiId.allow(null).required(),
          lastPostId: JoiId.allow(null).required(),
          lastPostAt: JoiDate.allow(null).required()
        })
        .required()
    },
    "POST /{postId}/likes": {
      req: {
        params: Joi.object()
          .keys({
            postId: JoiId.required()
          })
          .required()
      },
      res: JoiPostLikeObject.required()
    },
    "DELETE /{postId}/likes": {
      req: {
        params: Joi.object()
          .keys({
            postId: JoiId.required()
          })
          .required()
      },
      res: JoiPostLikeObject.required()
    }
  },
  comments: {
    "POST /": {
      req: {
        payload: Joi.object()
          .keys({
            postId: JoiId.required(),
            content: JoiContentComment.required()
          })
          .required()
      },
      res: Joi.object()
        .keys({
          comment: JoiCommentObject.required(),
          channelId: JoiId.required(),
          postId: JoiId.required()
        })
        .required()
    },
    "GET /{postId}": {
      req: {
        params: Joi.object()
          .keys({
            postId: JoiId.required()
          })
          .required(),
        query: Joi.object()
          .keys({
            afterCommentId: JoiId.optional(),
            beforeCommentId: JoiId.optional()
          })
          .optional()
      },
      res: Joi.object()
        .keys({
          comments: JoiCommentsObject.allow(null).required(),
          postId: JoiId.required(),
          afterCommentId: JoiId.optional(),
          beforeCommentId: JoiId.optional()
        })
        .required()
    },
    "DELETE /{commentId}": {
      req: {
        params: Joi.object()
          .keys({
            commentId: JoiId.required()
          })
          .required()
      },
      res: Joi.object()
        .keys({
          commentId: JoiId.required(),
          postId: JoiId.required(),
          channelId: JoiId.required(),
          firstCommentId: JoiId.allow(null).required(),
          lastCommentId: JoiId.allow(null).required(),
          lastCommentAt: JoiDate.allow(null).required()
        })
        .required()
    },
    "POST /{commentId}/likes": {
      req: {
        params: Joi.object()
          .keys({
            commentId: JoiId.required()
          })
          .required()
      },
      res: JoiCommentLikeObject.required()
    },
    "DELETE /{commentId}/likes": {
      req: {
        params: Joi.object()
          .keys({
            commentId: JoiId.required()
          })
          .required()
      },
      res: JoiCommentLikeObject.required()
    }
  },
  notifications: {
    "DELETE /{channelId}": {
      req: {
        params: Joi.object().keys({
          channelId: JoiId.required()
        })
      },
      res: Joi.object({
        channelId: JoiId.required(),
        userId: JoiId.required()
      }).required()
    }
  }
};
