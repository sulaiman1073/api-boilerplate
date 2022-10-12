/* eslint-disable no-nested-ternary */
const knex = require("../config/knex");

module.exports = ({
  channelId,
  queueStartPosition,
  videoStartTime,
  clockStartTime,
  status = null
}) => {
  const playerStatus = {
    updated_at: knex.raw("NOW()"),
    queue_start_position: queueStartPosition,
    video_start_time: videoStartTime,
    clock_start_time: clockStartTime
  };

  if (status) {
    playerStatus.status = status;
  }

  const query = knex
    .update(playerStatus)
    .from("channels")
    .where("id", channelId)
    .returning([
      "queue_start_position AS queueStartPosition",
      "video_start_time AS videoStartTime",
      "clock_start_time AS clockStartTime",
      "status"
    ]);

  return query.toString();
};
