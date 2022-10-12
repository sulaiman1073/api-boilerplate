const db = require("../config/database");

module.exports.addChatNotification = async ({ userId, channelId }) => {
  return db.NotificationRepository.addChatNotification({
    userId,
    channelId
  });
};

module.exports.deleteChatNotification = async ({ userId, channelId }) => {
  return db.NotificationRepository.deleteChatNotification({
    userId,
    channelId
  });
};
