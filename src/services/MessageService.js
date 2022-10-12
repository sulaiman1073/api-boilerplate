const db = require("../config/database");

module.exports.addMessage = async ({ userId, channelId, content, upload }) => {
  return db.MessageRepository.addMessage({
    userId,
    channelId,
    content,
    upload
  });
};

module.exports.getMessages = async ({
  userId,
  channelId,
  afterMessageId,
  beforeMessageId
}) => {
  return db.MessageRepository.getMessages({
    userId,
    channelId,
    afterMessageId,
    beforeMessageId
  });
};

module.exports.deleteMessage = async ({ userId, messageId }) => {
  return db.MessageRepository.deleteMessage({
    userId,
    messageId
  });
};
