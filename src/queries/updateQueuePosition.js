const knex = require("../config/knex");

module.exports = ({ channelId, oldIndex, newIndex }) => {
  const query = knex
    .update({ queue_position: newIndex })
    .from("channel_videos")
    .where("channel_id", channelId)
    .andWhere("queue_position", "=", oldIndex)
    .returning("id");

  return query.toString();
};
