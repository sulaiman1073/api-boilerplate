/* eslint-disable class-methods-use-this */
const queries = require("../queries");

class PostRepository {
  constructor(db) {
    this.db = db;
  }

  async addPost({ channelId, userId, content, upload }) {
    return this.db.one(queries.addPost, [channelId, userId, content, upload]);
  }

  async getPosts({ channelId, userId, afterPostId, beforePostId }) {
    return this.db.one(queries.getPosts, [
      channelId,
      userId,
      afterPostId,
      beforePostId
    ]);
  }

  async deletePost({ postId, userId }) {
    return this.db.one(queries.deletePost, [postId, userId]);
  }

  async addPostLike({ postId, userId }) {
    return this.db.one(queries.addPostLike, [postId, userId]);
  }

  async deletePostLike({ postId, userId }) {
    return this.db.one(queries.deletePostLike, [postId, userId]);
  }
}

module.exports = PostRepository;
