const { WS_EVENTS } = require("../config/constants");
const publisher = require("../config/publisher");
const CommentService = require("../services/CommentService");
const validators = require("../helpers/validators");

const controllers = [
  {
    method: "POST",
    path: "/",
    options: {
      description: "Adds comment",
      tags: ["api"],
      validate: validators.comments["POST /"].req,
      response: {
        status: {
          201: validators.comments["POST /"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { postId, content } = req.payload;
      const newComment = await CommentService.addComment({
        userId,
        postId,
        content
      });

      const response = { ...newComment, postId };

      publisher({
        type: WS_EVENTS.CHANNEL.ADD_COMMENT,
        channelId: newComment.channelId,
        initiator: userId,
        payload: response
      });

      return res.response(response).code(201);
    }
  },
  {
    method: "GET",
    path: "/{postId}",
    options: {
      description: "Gets post comments",
      tags: ["api"],
      validate: validators.comments["GET /{postId}"].req,
      response: {
        status: {
          200: validators.comments["GET /{postId}"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { postId } = req.params;
      const { afterCommentId, beforeCommentId } = req.query;
      const comments = await CommentService.getComments({
        userId,
        postId,
        afterCommentId,
        beforeCommentId
      });

      return { ...comments, postId, afterCommentId, beforeCommentId };
    }
  },
  {
    method: "DELETE",
    path: "/{commentId}",
    options: {
      description: "Deletes comment",
      tags: ["api"],
      validate: validators.comments["DELETE /{commentId}"].req,
      response: {
        status: {
          200: validators.comments["DELETE /{commentId}"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { commentId } = req.params;
      const deletedComment = await CommentService.deleteComment({
        userId,
        commentId
      });

      const response = deletedComment;

      publisher({
        type: WS_EVENTS.CHANNEL.DELETE_COMMENT,
        channelId: deletedComment.channelId,
        initiator: userId,
        payload: response
      });

      return response;
    }
  },
  {
    method: "POST",
    path: "/{commentId}/likes",
    options: {
      description: "Adds comment like",
      tags: ["api"],
      validate: validators.comments["POST /{commentId}/likes"].req,
      response: {
        status: {
          201: validators.comments["POST /{commentId}/likes"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { commentId } = req.params;
      const newLike = await CommentService.addCommentLike({
        userId,
        commentId
      });

      const response = newLike;

      publisher({
        type: WS_EVENTS.CHANNEL.ADD_COMMENT_LIKE,
        channelId: newLike.channelId,
        initiator: userId,
        payload: response
      });

      return res.response(response).code(201);
    }
  },
  {
    method: "DELETE",
    path: "/{commentId}/likes",
    options: {
      description: "Deletes comment like",
      tags: ["api"],
      validate: validators.comments["DELETE /{commentId}/likes"].req,
      response: {
        status: {
          200: validators.comments["DELETE /{commentId}/likes"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { commentId } = req.params;
      const deletedLike = await CommentService.deleteCommentLike({
        userId,
        commentId
      });

      const response = deletedLike;

      publisher({
        type: WS_EVENTS.CHANNEL.DELETE_COMMENT_LIKE,
        channelId: deletedLike.channelId,
        initiator: userId,
        payload: response
      });

      return response;
    }
  }
];

const CommentController = {
  name: "CommentController",
  version: "1.0.0",
  async register(server, options) {
    server.route(controllers);
  }
};

module.exports = CommentController;
