INSERT INTO
  members (channel_id, user_id)
SELECT
  $1 AS channel_id,
  $2 AS user_id
FROM
  channels
WHERE
  channels.id = $1
  AND channels.type != 'channel'
RETURNING
  channel_id AS "channelId",
  user_id AS "userId",
  created_at AS "createdAt",
  (
    SELECT
      type
    FROM
      channels
    WHERE
      channels.id = $1
  ) AS type
  (
    SELECT
      JSON_BUILD_OBJECT(
        'username',
        users.username,
        'firstName',
        users.first_name,
        'lastName',
        users.last_name,
        'avatar',
        users.avatar
      )
    FROM
      users
    WHERE
      users.id = user_id
  ) AS user
