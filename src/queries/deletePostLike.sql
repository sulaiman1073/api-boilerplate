DELETE FROM
  post_likes
WHERE
  post_id = $1
  AND user_id = $2
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
