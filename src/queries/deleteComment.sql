WITH dc AS (
  DELETE FROM
    comments
  WHERE
    comments.id = $1
  AND (
    comments.user_id = $2
    OR EXISTS (
      SELECT
        1
      FROM
        members
      JOIN
        posts
      ON
        posts.channel_id = members.channel_id
      WHERE
        posts.id = comments.post_id
        AND members.user_id = $2
        AND members.admin
    )
  )
  RETURNING
  id AS "commentId",
  post_id AS "postId",
  (
    SELECT
      posts.channel_id
    FROM
      posts
    WHERE
      posts.id = post_id
  ) AS "channelId"
), fc AS (
  SELECT
    comments.id AS "firstCommentId"
  FROM
    comments, dc
  WHERE
    comments.post_id = dc."postId"
    AND comments.id != dc."commentId"
  ORDER BY
    comments.created_at ASC
  LIMIT
    1
), lc AS (
  SELECT
    comments.id AS "lastCommentId",
    comments.created_at AS "lastCommentAt"
  FROM
    comments, dc
  WHERE
    comments.post_id = dc."postId"
    AND comments.id != dc."commentId"
  ORDER BY
    comments.created_at DESC
  LIMIT
    1
)
SELECT
  *
FROM
  dc
LEFT JOIN fc ON TRUE
LEFT JOIN lc ON TRUE
