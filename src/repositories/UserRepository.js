const queries = require("../queries");

class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async addUser({
    firstName,
    lastName,
    username,
    email,
    dateOfBirth,
    password
  }) {
    return this.db.one(queries.addUser, [
      firstName,
      lastName,
      username,
      email,
      dateOfBirth,
      password
    ]);
  }

  async getUser({ userId, username, email, usernameOrEmail, withPassword }) {
    return this.db.oneOrNone(queries.getUser, {
      userId,
      username,
      email,
      usernameOrEmail,
      withPassword
    });
  }

  async updateUser({
    userId,
    firstName,
    lastName,
    dateOfBirth,
    email,
    password,
    avatar,
    removeAvatar
  }) {
    return this.db.one(queries.updateUser, {
      userId,
      firstName,
      lastName,
      email,
      dateOfBirth,
      password,
      avatar,
      removeAvatar
    });
  }

  async deleteUser({ userId }) {
    return this.db.one(queries.deleteUser, [userId], res => res.id);
  }

  async searchUsers({ username }) {
    return this.db.any(queries.searchUsers, username);
  }

  async addFriendRequest({ fromUser, toUser }) {
    return this.db.one(queries.addUserRelationship, [
      fromUser,
      toUser,
      "friend"
    ]);
  }

  async deleteFriendRequest({ userId1, userId2 }) {
    return this.db.one(queries.deleteUserRelationship, [userId1, userId2]);
  }

  async addFriend({ userId1, userId2 }) {
    return this.db.one(queries.updateUserRelationship, [
      userId1,
      userId2,
      "friend_both"
    ]);
  }

  async deleteFriend({ userId1, userId2 }) {
    return this.db.one(queries.deleteUserRelationship, [userId1, userId2]);
  }

  async addBlock({ fromUser, toUser }) {
    return this.db.one(queries.addUserRelationship, [
      fromUser,
      toUser,
      "block"
    ]);
  }

  async updateBlock({ fromUser, toUser, blockType }) {
    return this.db.one(queries.updateUserRelationship, [
      fromUser,
      toUser,
      blockType
    ]);
  }

  async deleteBlock({ fromUser, toUser }) {
    return this.db.one(queries.deleteUserRelationship, [fromUser, toUser]);
  }

  async getUserRelationship({ userId1, userId2 }) {
    return this.db.oneOrNone(queries.getUserRelationship, [userId1, userId2]);
  }

  async getUsers({ userIds }) {
    return this.db.one(queries.getUsers, [userIds]);
  }
}

module.exports = UserRepository;
