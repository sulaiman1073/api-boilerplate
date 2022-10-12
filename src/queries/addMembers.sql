INSERT INTO
  members (
    channel_id,
    user_id,
    admin
  )
SELECT
  $1 AS "channel_id",
  mem.id AS "user_id",
  $3 AS admin
FROM
  unnest($2::UUID[]) AS mem(id)
RETURNING
  channel_id AS "channelId",
  user_id AS "userId",
  admin,
  created_at AS "createdAt"
