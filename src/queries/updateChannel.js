/* eslint-disable no-nested-ternary */
const knex = require("../config/knex");

module.exports = ({
  channelId,
  userId,
  name,
  description,
  publicChannel,
  icon,
  removeIcon
}) => {
  const query = knex
    .update({
      name: name === null ? null : name,
      description:
        description === undefined
          ? undefined
          : description.length === 0
          ? null
          : description,
      public: publicChannel === undefined ? undefined : publicChannel,
      icon: removeIcon ? null : icon,
      updated_at: knex.raw("NOW()")
    })
    .from("channels")
    .where("id", channelId)
    .whereExists(q =>
      q
        .select("*")
        .from("members")
        .where("channel_id", channelId)
        .andWhere("user_id", userId)
        .andWhere("admin", true).whereRaw(/* SQL */ `
        (
          channels.type != 'channel'
          OR members.admin
        )
      `)
    )
    .returning([
      "id",
      "type",
      "name",
      "description",
      "icon",
      "public",
      "owner_id AS ownerId",
      "created_at AS createdAt"
    ]);

  return query.toString();
};
