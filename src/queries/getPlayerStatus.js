/* eslint-disable no-nested-ternary */
const knex = require("../config/knex");

module.exports = ({ channelId }) => {
  const query = knex
    .select(
      "id",
      "queue_start_position AS queueStartPosition",
      "video_start_time AS videoStartTime",
      "clock_start_time AS clockStartTime",
      "status"
    )
    .from("channels")
    .where("id", channelId);

  return query.toString();
};
