INSERT INTO
  members (channel_id, user_id)
SELECT
  $1 AS channel_id,
  $2 AS user_id
FROM
  channels
WHERE
  channels.id = $1
  AND channels.type = 'channel'
  AND channels.public
  AND NOT EXISTS (
    SELECT
      1
    FROM
      members
    WHERE
      members.channel_id = $1
      AND members.user_id = $2
      AND members.banned
  )
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
      id = $1
  ) AS type,
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
