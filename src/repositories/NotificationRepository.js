/* eslint-disable class-methods-use-this */
const queries = require("../queries");

class NotificationRepository {
  constructor(db) {
    this.db = db;
  }

  async addChatNotification({ userId, channelId }) {
    return this.db.oneOrNone(queries.addChatNotification, [channelId, userId]);
  }

  async deleteChatNotification({ userId, channelId }) {
    return this.db.oneOrNone(queries.deleteChatNotification, [
      channelId,
      userId
    ]);
  }
}

module.exports = NotificationRepository;
