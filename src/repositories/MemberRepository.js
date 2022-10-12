const queries = require("../queries");

class MemberRepository {
  constructor(db) {
    this.db = db;
  }

  async addMember({ channelId, userId, admin = false }) {
    return this.db.one(queries.addMembers, [channelId, [userId], admin]);
  }

  async addMembers({ channelId, userIds, admin = false }) {
    return this.db.many(queries.addMembers, [channelId, userIds, admin]);
  }

  async addRoomMembers({ channelId, userId, userIds }) {
    return this.db.many(queries.addRoomMembers, [channelId, userId, userIds]);
  }

  async addRoomMember({ channelId, userId }) {
    return this.db.one(queries.addRoomMember, [channelId, userId]);
  }

  async addPublicMember({ channelId, userId }) {
    return this.db.one(queries.addPublicMember, [channelId, userId]);
  }

  async addPrivateMember({ channelId, userId }) {
    return this.db.one(queries.addPrivateMember, [channelId, userId]);
  }

  async deleteGroupRoomMember({ channelId, userId }) {
    return this.db.one(queries.deleteGroupRoomMember, [channelId, userId]);
  }

  async deleteChannelMember({ channelId, userId }) {
    return this.db.one(queries.deleteChannelMember, [channelId, userId]);
  }

  async addAdmin({ channelId, fromUser, toUser }) {
    return this.db.one(queries.addAdmin, [channelId, fromUser, toUser]);
  }

  async deleteAdmin({ channelId, fromUser, toUser }) {
    return this.db.one(queries.deleteAdmin, [channelId, fromUser, toUser]);
  }

  async addBan({ channelId, fromUser, toUser }) {
    return this.db.one(queries.addBan, [channelId, fromUser, toUser]);
  }

  async deleteBan({ channelId, fromUser, toUser }) {
    return this.db.one(queries.deleteBan, [channelId, fromUser, toUser]);
  }
}

module.exports = MemberRepository;
