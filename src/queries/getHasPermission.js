const knex = require("../config/knex");

module.exports = ({ userId, channelId }) => {
  const query = knex
    .select("user_id")
    .from("members")
    .innerJoin("channels", "channels.id", "members.channel_id")
    .where("channel_id", channelId)
    .andWhere("user_id", userId).whereRaw(/* SQL */ `
    (
      channels.type != 'channel'
      OR members.admin
    )
  `);

  return query.toString();
};
