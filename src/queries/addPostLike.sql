INSERT INTO
  post_likes (post_id, user_id)
SELECT
  posts.id AS "post_id",
  members.user_id AS "user_id"
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
RETURNING
  post_id AS "postId",
  user_id AS "userId",
  (
    SELECT
      posts.channel_id
    FROM
      posts
    WHERE
      posts.id = $1
  ) AS "channelId"
