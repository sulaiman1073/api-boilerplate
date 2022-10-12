INSERT INTO
  comments (post_id, user_id, content)
SELECT
  id as "post_id",
  $2 as "user_id",
  $3 AS "content"
FROM
  posts
JOIN
  members
ON
  members.channel_id = posts.channel_id
WHERE
  posts.id = $1
  AND members.user_id = $2
  AND NOT members.banned
  AND (
    CASE
      WHEN
        members.admin
      THEN
        TRUE
      ELSE
        (
          SELECT
            COUNT(*)
          FROM
            comments
          WHERE
            comments.post_id = posts.id
            AND comments.user_id = members.user_id
        ) < 5
    END
  )
RETURNING
  JSON_BUILD_OBJECT(
    'id',
    id,
    'channelId',
    (
      SELECT
        posts.channel_id
      FROM
        posts
      WHERE
        posts.id = post_id
     ),
    'postId',
    post_id,
    'userId',
    user_id,
    'content',
    content,
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
    ),
    'liked',
    FALSE,
    'likeCount',
    0
  ) AS "comment",
  (
  SELECT
    posts.channel_id
  FROM
    posts
  WHERE
    posts.id = post_id
  ) AS "channelId"
