const db = require("../config/database");

// addPublicMember for public channel members
// addPrivateMember for private channel members
// addRoomMember for group room members

module.exports.addMember = async ({ channelId, userId }) => {
  return db.MemberRepository.addPublicMember({ channelId, userId });
};

module.exports.addRoomMembers = async ({ userId, channelId, userIds }) => {
  return db.task(async t => {
    await t.MemberRepository.addRoomMembers({
      channelId,
      userId,
      userIds
    });

    const room = await t.ChannelRepository.getRoomChannel({
      channelId
    });

    return room;
  });
};

module.exports.deleteMember = async ({ channelId, userId }) => {
  return db.tx(async tx => {
    let deletedChannel;
    const deletedMember = await tx.MemberRepository.deleteChannelMember({
      channelId,
      userId
    });

    if (deletedMember.memberCount === 1) {
      deletedChannel = await tx.ChannelRepository.deleteChannel({
        channelId,
        userId
      });
    }

    return deletedChannel;
  });
};

module.exports.addAdmin = async ({ channelId, fromUser, toUser }) => {
  return db.MemberRepository.addAdmin({ channelId, fromUser, toUser });
};

module.exports.deleteAdmin = async ({ channelId, fromUser, toUser }) => {
  return db.MemberRepository.deleteAdmin({ channelId, fromUser, toUser });
};

module.exports.addBan = async ({ channelId, fromUser, toUser }) => {
  return db.MemberRepository.addBan({ channelId, fromUser, toUser });
};

module.exports.deleteBan = async ({ channelId, fromUser, toUser }) => {
  return db.MemberRepository.deleteBan({ channelId, fromUser, toUser });
};
