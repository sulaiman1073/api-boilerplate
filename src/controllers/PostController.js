const { WS_EVENTS } = require("../config/constants");
const publisher = require("../config/publisher");
const PostService = require("../services/PostService");
const validators = require("../helpers/validators");

const controllers = [
  {
    method: "POST",
    path: "/",
    options: {
      description: "Adds post",
      tags: ["api"],
      validate: validators.posts["POST /"].req,
      response: {
        status: {
          201: validators.posts["POST /"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId, content, upload } = req.payload;
      const newPost = await PostService.addPost({
        userId,
        channelId,
        content,
        upload
      });

      const response = { ...newPost, channelId };

      publisher({
        type: WS_EVENTS.CHANNEL.ADD_POST,
        channelId,
        initiator: userId,
        payload: response
      });

      return res.response(response).code(201);
    }
  },
  {
    method: "GET",
    path: "/{channelId}",
    options: {
      description: "Gets channel posts",
      tags: ["api"],
      validate: validators.posts["GET /{channelId}"].req,
      response: {
        status: {
          200: validators.posts["GET /{channelId}"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { channelId } = req.params;
      const { afterPostId, beforePostId } = req.query;
      const posts = await PostService.getPosts({
        userId,
        channelId,
        afterPostId,
        beforePostId
      });

      return { ...posts, channelId, afterPostId, beforePostId };
    }
  },
  {
    method: "DELETE",
    path: "/{postId}",
    options: {
      description: "Deletes post",
      tags: ["api"],
      validate: validators.posts["DELETE /{postId}"].req,
      response: {
        status: {
          200: validators.posts["DELETE /{postId}"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { postId } = req.params;
      const deletedPost = await PostService.deletePost({ userId, postId });

      const response = deletedPost;

      publisher({
        type: WS_EVENTS.CHANNEL.DELETE_POST,
        channelId: deletedPost.channelId,
        initiator: userId,
        payload: response
      });

      return response;
    }
  },
  {
    method: "POST",
    path: "/{postId}/likes",
    options: {
      description: "Adds post like",
      tags: ["api"],
      validate: validators.posts["POST /{postId}/likes"].req,
      response: {
        status: {
          201: validators.posts["POST /{postId}/likes"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { postId } = req.params;
      const newLike = await PostService.addPostLike({ userId, postId });

      const response = newLike;

      publisher({
        type: WS_EVENTS.CHANNEL.ADD_POST_LIKE,
        channelId: newLike.channelId,
        initiator: userId,
        payload: response
      });

      return res.response(response).code(201);
    }
  },
  {
    method: "DELETE",
    path: "/{postId}/likes",
    options: {
      description: "Deletes post like",
      tags: ["api"],
      validate: validators.posts["DELETE /{postId}/likes"].req,
      response: {
        status: {
          200: validators.posts["DELETE /{postId}/likes"].res
        }
      }
    },
    async handler(req, res) {
      const { id: userId } = req.auth.credentials;
      const { postId } = req.params;
      const deletedLike = await PostService.deletePostLike({ userId, postId });

      const response = deletedLike;

      publisher({
        type: WS_EVENTS.CHANNEL.DELETE_POST_LIKE,
        channelId: deletedLike.channelId,
        initiator: userId,
        payload: response
      });

      return response;
    }
  }
];

const PostController = {
  name: "PostController",
  version: "1.0.0",
  async register(server, options) {
    server.route(controllers);
  }
};

module.exports = PostController;
