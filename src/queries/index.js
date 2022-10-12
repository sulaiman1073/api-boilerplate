const { QueryFile } = require("pg-promise");
const path = require("path");

function sql(file) {
  const fullPath = path.join(__dirname, file);
  const options = { minify: true };
  const qf = new QueryFile(fullPath, options);
  // eslint-disable-next-line no-console
  if (qf.error) console.error(qf.error);
  return qf;
}

module.exports = {
  /* -------------------------------------------------------------------------- */
  /*                                    USERS                                   */
  /* -------------------------------------------------------------------------- */

  addUser: sql("./addUser.sql"),
  getUser: require("./getUser"),
  getUsers: sql("./getUsers.sql"),
  updateUser: require("./updateUser.js"),
  deleteUser: sql("./deleteUser.sql"),
  searchUsers: sql("./searchUsers.sql"),
  addUserRelationship: sql("./addUserRelationship.sql"),
  getUserRelationship: sql("./getUserRelationship.sql"),
  updateUserRelationship: sql("./updateUserRelationship.sql"),
  deleteUserRelationship: sql("./deleteUserRelationship.sql"),

  /* -------------------------------------------------------------------------- */
  /*                                  SESSIONS                                  */
  /* -------------------------------------------------------------------------- */

  getLoginData: sql("./getLoginData.sql"),

  /* -------------------------------------------------------------------------- */
  /*                                  CHANNELS                                  */
  /* -------------------------------------------------------------------------- */

  addChannel: sql("./addChannel.sql"),
  addRoom: sql("./addRoom.sql"),
  getAdminChannel: sql("./getAdminChannel.sql"),
  getPublicChannel: sql("./getPublicChannel.sql"),
  getPrivateChannel: sql("./getPrivateChannel.sql"),
  getRoomChannel: sql("./getRoomChannel.sql"),
  getChannelAndMemberInfo: sql("./getChannelAndMemberInfo.sql"),
  updateChannel: require("./updateChannel.js"),
  updatePlayerStatus: require("./updatePlayerStatus.js"),
  getPlayerStatus: require("./getPlayerStatus.js"),
  deleteChannel: sql("./deleteChannel.sql"),
  deleteFriendRoom: sql("./deleteFriendRoom.sql"),
  searchChannels: sql("./searchChannels.sql"),
  getAvatars: sql("./getAvatars.sql"),
  getDiscoverChannels: sql("./getDiscoverChannels.sql"),
  getTrendingChannels: sql("./getTrendingChannels.sql"),
  getFollowingChannels: sql("./getFollowingChannels.sql"),

  /* -------------------------------------------------------------------------- */
  /*                                    VIDEOS                                  */
  /* -------------------------------------------------------------------------- */

  addVideo: sql("./addVideo.sql"),
  addChannelVideo: sql("./addChannelVideo.sql"),
  deleteChannelVideo: require("./deleteChannelVideo"),
  getHasPermission: require("./getHasPermission.js"),
  getChannelQueue: sql("./getChannelQueue.sql"),
  updateQueuePosition: require("./updateQueuePosition.js"),
  updateQueuePositionsAfterDelete: require("./updateQueuePositionsAfterDelete"),
  updateQueuePositionsAfterHighToLowSwap: require("./updateQueuePositionsAfterHighToLowSwap.js"),
  updateQueuePositionsAfterLowToHighSwap: require("./updateQueuePositionsAfterLowToHighSwap.js"),
  getVideosInfo: sql("./getVideosInfo.sql"),

  /* -------------------------------------------------------------------------- */
  /*                                   MEMBERS                                  */
  /* -------------------------------------------------------------------------- */

  addMembers: sql("./addMembers.sql"),
  addPublicMember: sql("./addPublicMember.sql"),
  addPrivateMember: sql("./addPrivateMember.sql"),
  addRoomMember: sql("./addRoomMember.sql"),
  addRoomMembers: sql("./addRoomMembers.sql"),
  deleteGroupRoomMember: sql("./deleteGroupRoomMember.sql"),
  deleteChannelMember: sql("./deleteChannelMember.sql"),
  deleteMember: sql("./deleteMember.sql"),
  addAdmin: sql("./addAdmin.sql"),
  deleteAdmin: sql("./deleteAdmin.sql"),
  addBan: sql("./addBan.sql"),
  deleteBan: sql("./deleteBan.sql"),

  /* -------------------------------------------------------------------------- */
  /*                                  MESSAGES                                  */
  /* -------------------------------------------------------------------------- */

  addMessage: sql("./addMessage.sql"),
  deleteMessage: sql("./deleteMessage.sql"),
  getMessages: sql("./getMessages.sql"),

  /* -------------------------------------------------------------------------- */
  /*                                    POSTS                                   */
  /* -------------------------------------------------------------------------- */

  addPost: sql("./addPost.sql"),
  deletePost: sql("./deletePost.sql"),
  getPosts: sql("./getPosts.sql"),
  addPostLike: sql("./addPostLike.sql"),
  deletePostLike: sql("./deletePostLike.sql"),

  /* -------------------------------------------------------------------------- */
  /*                                  COMMENTS                                  */
  /* -------------------------------------------------------------------------- */

  addComment: sql("./addComment.sql"),
  deleteComment: sql("./deleteComment.sql"),
  getComments: sql("./getComments.sql"),
  addCommentLike: sql("./addCommentLike.sql"),
  deleteCommentLike: sql("./deleteCommentLike.sql"),

  /* -------------------------------------------------------------------------- */
  /*                                NOTIFICATIONS                               */
  /* -------------------------------------------------------------------------- */

  addChatNotification: sql("./addChatNotification.sql"),
  deleteChatNotification: sql("./deleteChatNotification.sql")
};
