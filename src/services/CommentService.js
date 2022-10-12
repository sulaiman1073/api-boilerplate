const db = require("../config/database");

module.exports.addComment = async ({ postId, userId, content }) => {
  return db.CommentRepository.addComment({ postId, userId, content });
};

module.exports.getComments = async ({
  userId,
  postId,
  afterCommentId,
  beforeCommentId
}) => {
  return db.CommentRepository.getComments({
    userId,
    postId,
    afterCommentId,
    beforeCommentId
  });
};

module.exports.deleteComment = async ({ commentId, userId }) => {
  return db.CommentRepository.deleteComment({
    commentId,
    userId
  });
};

module.exports.addCommentLike = async ({ commentId, userId }) => {
  return db.CommentRepository.addCommentLike({
    commentId,
    userId
  });
};

module.exports.deleteCommentLike = async ({ commentId, userId }) => {
  return db.CommentRepository.deleteCommentLike({
    commentId,
    userId
  });
};
