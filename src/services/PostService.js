const db = require("../config/database");

module.exports.addPost = async ({ userId, channelId, content, upload }) => {
  return db.PostRepository.addPost({ userId, channelId, content, upload });
};

module.exports.getPosts = async ({
  userId,
  channelId,
  afterPostId,
  beforePostId
}) => {
  return db.PostRepository.getPosts({
    userId,
    channelId,
    afterPostId,
    beforePostId
  });
};

module.exports.deletePost = async ({ postId, userId }) => {
  return db.PostRepository.deletePost({
    userId,
    postId
  });
};

module.exports.addPostLike = async ({ postId, userId }) => {
  return db.PostRepository.addPostLike({
    postId,
    userId
  });
};

module.exports.deletePostLike = async ({ postId, userId }) => {
  return db.PostRepository.deletePostLike({
    postId,
    userId
  });
};
