DELETE FROM
  chat_notifications
WHERE
  channel_id = $1
  AND user_id = $2
RETURNING
  channel_id AS "channelId",
  user_id AS "userId"