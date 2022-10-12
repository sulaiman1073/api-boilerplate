const Boom = require("@hapi/boom");
const bcrypt = require("bcryptjs");
const fileType = require("file-type");
const { uploadFile } = require("../config/aws");
const db = require("../config/database");

module.exports.addUser = async ({
  firstName,
  lastName,
  username,
  dateOfBirth,
  email,
  password
}) => {
  return db.tx(async tx => {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await tx.UserRepository.addUser({
      firstName,
      lastName,
      username,
      email,
      dateOfBirth,
      password: hashedPassword
    });

    if (!newUser.newUser) {
      if (newUser.username === username)
        throw Boom.conflict("Username already in use");
      if (newUser.email === email) throw Boom.conflict("Email already in use");
    }

    const newChannel = await tx.ChannelRepository.addSelfRoom();

    await tx.MemberRepository.addMember({
      channelId: newChannel.id,
      userId: newUser.id
    });

    return newUser;
  });
};

module.exports.getUser = async ({ userId }) => {
  return db.UserRepository.getUser({ userId });
};

module.exports.updateUser = async ({
  userId,
  firstName,
  lastName,
  dateOfBirth,
  email,
  password,
  newPassword,
  removeAvatar,
  avatar
}) => {
  return db.task(async t => {
    let uploadedAvatar;
    let hashedPassword;

    if (password) {
      const user = await t.UserRepository.getUser({
        userId,
        withPassword: true
      });
      const passwordCorrect = await bcrypt.compare(password, user.password);
      if (!passwordCorrect) throw Boom.unauthorized("Incorrect Password");
    }
    if (newPassword) hashedPassword = await bcrypt.hash(newPassword, 10);

    if (avatar) {
      const { payload: buffer } = avatar;
      const type = fileType(buffer);
      const fileName = `avatar-${userId}_${new Date().getTime()}`;
      const uploadedImage = await uploadFile(buffer, fileName, type);
      if (!uploadedImage) throw Boom.internal("Couldn't upload avatar");
      uploadedAvatar = uploadedImage.Location;
    }

    let newUser;
    try {
      newUser = await t.UserRepository.updateUser({
        userId,
        firstName,
        lastName,
        dateOfBirth,
        email,
        password: hashedPassword,
        avatar: uploadedAvatar,
        removeAvatar
      });
    } catch (error) {
      if (error.constraint === "unique_email") {
        throw Boom.conflict("Email already in use");
      } else {
        throw Boom.internal();
      }
    }

    return newUser;
  });
  // handle case where user changes email to an email that's already being used
  // Catch to delete uploaded avatar
};

module.exports.deleteUser = async ({ userId }) => {
  return db.UserRepository.deleteUser({ userId });
};

module.exports.searchUsers = async ({ username }) => {
  return db.UserRepository.searchUsers({ username });
};

module.exports.addFriendRequest = async ({ fromUser, toUser }) => {
  return db.task(async t => {
    const userRelationship = await t.UserRepository.getUserRelationship({
      userId1: fromUser,
      userId2: toUser
    });

    if (!userRelationship) {
      await t.UserRepository.addFriendRequest({ fromUser, toUser });
      const user = await t.UserRepository.getUser({ userId: fromUser });
      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      };
    }
  });
};

module.exports.deleteFriendRequest = async ({ userId1, userId2 }) => {
  return db.task(async t => {
    const userRelationship = await t.UserRepository.getUserRelationship({
      userId1,
      userId2
    });

    if (
      userRelationship.type === "friend_first_second" ||
      userRelationship.type === "friend_second_first"
    ) {
      return db.UserRepository.deleteFriendRequest({ userId1, userId2 });
    }
  });
};

module.exports.addFriend = async ({ userId1, userId2 }) => {
  return db.tx(async tx => {
    const userRelationship = await tx.UserRepository.getUserRelationship({
      userId1,
      userId2
    });

    if (
      (userRelationship.type === "friend_first_second" &&
        userId1 === userRelationship.secondUserId) ||
      (userRelationship.type === "friend_second_first" &&
        userId1 === userRelationship.firstUserId)
    ) {
      await tx.UserRepository.addFriend({ userId1, userId2 });
      const newChannel = await tx.ChannelRepository.addFriendRoom();
      await tx.MemberRepository.addMembers({
        channelId: newChannel.id,
        userIds: [userId1, userId2]
      });
      const channelInfo = await tx.ChannelRepository.getRoomChannel({
        channelId: newChannel.id
      });
      return channelInfo;
    }
  });
};

module.exports.deleteFriend = async ({ userId1, userId2 }) => {
  return db.tx(async tx => {
    const userRelationship = await tx.UserRepository.getUserRelationship({
      userId1,
      userId2
    });

    if (userRelationship.type === "friend_both") {
      await tx.UserRepository.deleteFriend({ userId1, userId2 });
      const deletedChannel = await tx.ChannelRepository.deleteFriendRoom({
        userId1,
        userId2
      });
      return deletedChannel;
    }
  });
};

module.exports.addBlock = async ({ fromUser, toUser }) => {
  return db.task(async t => {
    const userRelationship = await t.UserRepository.getUserRelationship({
      userId1: fromUser,
      userId2: toUser
    });

    let blockInfo = {};
    if (!userRelationship) {
      // Add a block from user to stranger
      blockInfo = await t.UserRepository.addBlock({ fromUser, toUser });
    } else if (
      userRelationship.type === "friend_first_second" ||
      userRelationship.type === "friend_second_first"
    ) {
      // Reject/Cancel friend request and replace it with a block
      blockInfo = await t.UserRepository.updateBlock({
        fromUser,
        toUser,
        blockType:
          fromUser === userRelationship.firstUserId
            ? "block_first_second"
            : "block_second_first"
      });
    } else if (
      (userRelationship.type === "block_first_second" &&
        fromUser === userRelationship.secondUserId) ||
      (userRelationship.type === "block_second_first" &&
        fromUser === userRelationship.firstUserId)
    ) {
      // Both users have blocked each other
      blockInfo = await t.UserRepository.updateBlock({
        fromUser,
        toUser,
        blockType: "block_both"
      });
    } else if (userRelationship.type === "friend_both") {
      // Delete friend and room and add a block
      await t.UserRepository.deleteFriend({
        userId1: fromUser,
        userId2: toUser
      });
      const deletedChannel = await t.ChannelRepository.deleteFriendRoom({
        userId1: fromUser,
        userId2: toUser
      });
      blockInfo.channelId = deletedChannel.id;
      blockInfo.isFriend = true;
      await t.UserRepository.addBlock({ fromUser, toUser });
    }

    return blockInfo;
  });
};

module.exports.deleteBlock = async ({ fromUser, toUser }) => {
  return db.task(async t => {
    const userRelationship = await t.UserRepository.getUserRelationship({
      userId1: fromUser,
      userId2: toUser
    });

    let blockInfo;

    if (
      (userRelationship.type === "block_first_second" &&
        fromUser === userRelationship.firstUserId) ||
      (userRelationship.type === "block_second_first" &&
        fromUser === userRelationship.secondUserId)
    ) {
      // Delete block from user to stranger
      await t.UserRepository.deleteBlock({
        fromUser,
        toUser
      });
    } else if (userRelationship.type === "block_both") {
      // Remove the block from this user to the other user
      blockInfo = await t.UserRepository.updateBlock({
        fromUser,
        toUser,
        blockType:
          fromUser === userRelationship.firstUserId
            ? "block_second_first"
            : "block_first_second"
      });
    }

    return blockInfo;
  });
};
