const knex = require("../config/knex");

module.exports = ({ channelId, channelVideoId, oldIndex, newIndex }) => {
  const query = knex("channel_videos")
    .where("channel_id", channelId)
    .andWhere("queue_position", "<=", newIndex)
    .andWhere("queue_position", ">", oldIndex)
    .andWhere("id", "<>", channelVideoId)
    .decrement("queue_position", 1)
    .returning("id");

  return query.toString();
};
