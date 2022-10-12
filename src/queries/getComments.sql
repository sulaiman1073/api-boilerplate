WITH cmnts AS (
  SELECT
    *,
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
        users.id = c.user_id
    ) AS author,
  (
    CASE
      WHEN
        EXISTS (
          SELECT
            1
          FROM
            comment_likes
          WHERE
            comment_likes.comment_id = c.id
            AND comment_likes.user_id = $2
        )
      THEN
        TRUE
      ELSE
        FALSE
    END
  ) AS "liked",
  (
    SELECT
      COUNT(*)::SMALLINT
    FROM
      comment_likes
    WHERE
      comment_likes.comment_id = c.id
  ) AS "like_count"
  FROM (
    SELECT
      *
    FROM (
      SELECT
        comments.*
      FROM
        comments
      WHERE
        comments.post_id = $1
        AND (
          CASE
            WHEN
              $3 IS NOT NULL AND $4 IS NOT NULL
            THEN
              (
                comments.created_at > (
                  SELECT
                    c.created_at
                  FROM
                    comments AS c
                  WHERE
                    c.id = $3
                )
                AND
                comments.created_at < (
                  SELECT
                    c.created_at
                  FROM
                    comments AS c
                  WHERE
                    c.id = $4
                )
              )
            WHEN
              $3 IS NOT NULL
            THEN
              comments.created_at > (
                SELECT
                  c.created_at
                FROM
                  comments AS c
                WHERE
                  c.id = $3
              )
            WHEN
              $4 IS NOT NULL
            THEN
              comments.created_at < (
                SELECT
                  c.created_at
                FROM
                  comments AS c
                WHERE
                  c.id = $4
              )
            ELSE
              TRUE
          END
        )
      ORDER BY
        comments.created_at DESC
      LIMIT
        3
    ) AS co
    ORDER BY
      co.created_at ASC
  ) c
), cmnts_obj AS (
  SELECT
    JSON_OBJECT_AGG(
      cmnts.id,
      JSON_BUILD_OBJECT(
        'id',
        cmnts.id,
        'postId',
        cmnts.post_id,
        'userId',
        cmnts.user_id,
        'content',
        cmnts.content,
        'createdAt',
        cmnts.created_at,
        'author',
        cmnts.author,
        'liked',
        cmnts.liked,
        'likeCount',
        cmnts.like_count
      )
    ) AS comments
  FROM
    cmnts
)
SELECT
  cmnts_obj.comments
FROM
  cmnts_obj
