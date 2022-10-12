INSERT INTO
  comment_likes (comment_id, user_id)
SELECT
  comments.id AS "comment_id",
  members.user_id AS "user_id"
FROM
  comments
JOIN
  posts
ON
  posts.id = comments.post_id
JOIN
  members
ON
  members.channel_id = posts.channel_id
WHERE
  comments.id = $1
  AND members.user_id = $2
  AND NOT members.banned
RETURNING
  comment_id AS "commentId",
  user_id AS "userId",
  (
    SELECT
      comments.post_id
    FROM
      comments
    WHERE
      comments.id = comment_id
  ) AS "postId",
  (
    SELECT
      posts.channel_id
    FROM
      comments
    JOIN
      posts
    ON
      posts.id = comments.post_id
    WHERE
      comments.id = comment_id
  ) AS "channelId"
