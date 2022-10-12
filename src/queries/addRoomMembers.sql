INSERT INTO
  members (channel_id, user_id)
SELECT
  $1 AS channel_id,
  mem.id AS "user_id"
FROM
  unnest($3::UUID[]) AS mem(id)
WHERE
  EXISTS (
    SELECT
      1
    FROM
      members
    WHERE
      channel_id = $1
      AND user_id = $2
  )
RETURNING
  channel_id AS "channelId",
  user_id AS "userId"
