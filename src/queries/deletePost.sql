WITH dp AS (
  DELETE FROM
    posts
  WHERE
    posts.id = $1
  AND (
    posts.user_id = $2
    OR EXISTS (
    SELECT
      1
    FROM
      members
    WHERE
      members.channel_id = posts.channel_id
      AND members.user_id = $2
      AND members.admin
    )
  )
  RETURNING
  id AS "postId",
  channel_id AS "channelId"
), fp AS (
  SELECT
    posts.id AS "firstPostId"
  FROM
    posts, dp
  WHERE
    posts.channel_id = dp."channelId"
    AND posts.id != dp."postId"
  ORDER BY
    posts.created_at ASC
  LIMIT
    1
), lp AS (
  SELECT
    posts.id AS "lastPostId",
    posts.created_at AS "lastPostAt"
  FROM
    posts, dp
  WHERE
    posts.channel_id = dp."channelId"
    AND posts.id != dp."postId"
  ORDER BY
    posts.created_at DESC
  LIMIT
    1
)
SELECT
  *
FROM
  dp
LEFT JOIN fp ON TRUE
LEFT JOIN lp ON TRUE
