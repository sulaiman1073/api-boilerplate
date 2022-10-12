/* eslint-disable class-methods-use-this */
const queries = require("../queries");

class MessageRepository {
  constructor(db) {
    this.db = db;
  }

  async addMessage({ channelId, userId, content, upload }) {
    return this.db.one(queries.addMessage, [
      channelId,
      userId,
      content,
      upload
    ]);
  }

  async getMessages({ channelId, userId, afterMessageId, beforeMessageId }) {
    return this.db.one(queries.getMessages, [
      channelId,
      userId,
      afterMessageId,
      beforeMessageId
    ]);
  }

  async deleteMessage({ messageId, userId }) {
    return this.db.one(queries.deleteMessage, [messageId, userId]);
  }
}

module.exports = MessageRepository;
