UPDATE
  members
SET
  banned = FALSE,
  updated_at = NOW()
WHERE
  channel_id = $1
  AND user_id = $3
  AND EXISTS (
    SELECT
      1
    FROM
      members AS m
    WHERE
      m.channel_id = $1
      AND m.user_id = $2
      AND m.admin = TRUE
  )
RETURNING
  channel_id AS "channelId",
  user_id AS "userId",
  admin,
  banned
