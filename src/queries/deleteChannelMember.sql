DELETE FROM
  members
WHERE
  channel_id = $1
  AND user_id = $2
  AND NOT banned
  AND NOT EXISTS (
    SELECT
      1
    FROM
      channels
    WHERE
      channels.id = channel_id
      AND owner_id = user_id
  )
RETURNING
  channel_id AS "channelId",
  user_id AS "userId"
