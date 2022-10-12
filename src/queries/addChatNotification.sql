INSERT INTO
  chat_notifications (channel_id, user_id)
SELECT
  members.channel_id AS "channel_id",
  members.user_id AS "user_id"
FROM
  members
WHERE
  members.channel_id = $1
  AND members.user_id != $2
  AND NOT members.banned
ON
  CONFLICT DO NOTHING
RETURNING
  channel_id AS "channelId",
  user_id AS "userId"
