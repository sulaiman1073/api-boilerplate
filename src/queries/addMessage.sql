INSERT INTO
  messages (channel_id, user_id, content, upload)
SELECT
  id as "channel_id",
  $2 as "user_id",
  $3 AS "content",
  $4 AS "upload"
FROM
  channels
WHERE
  channels.id = $1
  AND (
    channels.public = true
    OR EXISTS (
      SELECT
        1
      FROM
        members
      WHERE
        members.channel_id = $1
        AND members.user_id = $2
        AND NOT members.banned
    )
  )
RETURNING
  JSON_BUILD_OBJECT(
    'id',
    id,
    'channelId',
    channel_id,
    'userId',
    user_id,
    'content',
    content,
    'upload',
    upload,
    'createdAt',
    created_at,
    'author',
    (
      SELECT
        JSON_BUILD_OBJECT(
          'id',
          users.id,
          'username',
          users.username,
          'avatar',
          users.avatar
        )
      FROM
        users
      WHERE
        users.id = user_id
    )
  ) AS "message"
