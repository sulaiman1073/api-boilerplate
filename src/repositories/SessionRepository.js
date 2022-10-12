/* eslint-disable class-methods-use-this */
const queries = require("../queries");

class SessionRepository {
  constructor(db) {
    this.db = db;
  }

  async getLoginData({ userId }) {
    const loginData = await this.db.one(queries.getLoginData, [userId]);
    return loginData;
  }
}

module.exports = SessionRepository;
