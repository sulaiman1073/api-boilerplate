/* eslint-disable prefer-const */
const Redis = require("ioredis");
const config = require(".");

const { WS_EVENTS } = require("./constants");

const pub = new Redis({
  host: config.redisHost || "localhost",
  port: config.redisPort || 6379,
  db: config.redisIndex || 0,
  password: config.redisPassword || null
});

module.exports = async ({ type, initiator, channelId, userId, payload }) => {
  if (WS_EVENTS.USER[type]) {
    pub.publish(
      userId,
      JSON.stringify({
        userId,
        channelId,
        type,
        payload
      })
    );
  } else if (WS_EVENTS.CHANNEL[type] || WS_EVENTS.VIDEO_CONTROL[type]) {
    pub.publish(
      channelId,
      JSON.stringify({
        channelId,
        type,
        payload,
        initiator
      })
    );
  }
  if (WS_EVENTS.USER_CHANNEL[type]) {
    if (type === WS_EVENTS.USER_CHANNEL.JOIN_CHANNEL) {
      pub.publish(
        userId,
        JSON.stringify({
          type: WS_EVENTS.USER.SUBSCRIBE_CHANNEL,
          userId,
          payload
        })
      );
      pub.publish(
        channelId,
        JSON.stringify({
          type: WS_EVENTS.CHANNEL.ADD_VIEWER,
          channelId,
          payload,
          initiator
        })
      );
    } else if (type === WS_EVENTS.USER_CHANNEL.LEAVE_CHANNEL) {
      pub.publish(
        userId,
        JSON.stringify({
          type: WS_EVENTS.USER.UNSUBSCRIBE_CHANNEL,
          userId,
          payload
        })
      );
      pub.publish(
        channelId,
        JSON.stringify({
          type: WS_EVENTS.CHANNEL.DELETE_VIEWER,
          channelId,
          payload,
          initiator
        })
      );
    } else if (type === WS_EVENTS.USER_CHANNEL.UNFRIEND) {
      pub.publish(
        channelId,
        JSON.stringify({
          type: WS_EVENTS.CHANNEL.DELETE_CHANNEL,
          channelId,
          payload
        })
      );
      pub.publish(
        userId,
        JSON.stringify({
          type: WS_EVENTS.USER.DELETE_FRIEND,
          userId,
          payload
        })
      );
    } else if (type === WS_EVENTS.USER_CHANNEL.BLOCK_FRIEND) {
      pub.publish(
        channelId,
        JSON.stringify({
          type: WS_EVENTS.CHANNEL.DELETE_CHANNEL,
          channelId,
          payload
        })
      );
      pub.publish(
        userId,
        JSON.stringify({
          type: WS_EVENTS.USER.ADD_BLOCKER,
          userId,
          payload
        })
      );
    }
  } else if (WS_EVENTS.USERS_CHANNELS[type]) {
    console.log("WS_EVENTS.USERS_CHANNELS");
  }
};
