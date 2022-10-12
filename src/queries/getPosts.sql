WITH psts AS (
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
        users.id = p.user_id
    ) AS "author",
    (
      CASE
        WHEN
          EXISTS (
            SELECT
              1
            FROM
              post_likes
            WHERE
              post_likes.post_id = p.id
              AND post_likes.user_id = $2
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
        post_likes
      WHERE
        post_likes.post_id = p.id
    ) AS "like_count",
    (
      SELECT
        COUNT(*)::SMALLINT
      FROM
        comments
      WHERE
        comments.post_id = p.id
    ) AS "comment_count",
    (
      SELECT
        COUNT(*)::SMALLINT
      FROM
        comments
      WHERE
        comments.post_id = p.id
        AND comments.user_id = $2
    ) AS "self_comment_count",
    (
      SELECT
        comments.id
      FROM
        comments
      WHERE
        comments.post_id = p.id
      ORDER BY
        comments.created_at ASC
      LIMIT
        1
    ) AS "first_comment_id",
    (
      SELECT
        comments.id
      FROM
        comments
      WHERE
        comments.post_id = p.id
      ORDER BY
        comments.created_at DESC
      LIMIT
        1
    ) AS "last_comment_id"
  FROM (
    SELECT
      posts.*
    FROM
      posts
    WHERE
      posts.channel_id = $1
      AND (
        CASE
          WHEN
            $3 IS NOT NULL AND $4 IS NOT NULL
          THEN
            (
              posts.created_at > (
                SELECT
                  p.created_at
                FROM
                  posts AS p
                WHERE
                  p.id = $3
              )
              AND
              posts.created_at < (
                SELECT
                  p.created_at
                FROM
                  posts AS p
                WHERE
                  p.id = $4
              )
            )
          WHEN
            $3 IS NOT NULL
          THEN
            posts.created_at > (
              SELECT
                p.created_at
              FROM
                posts AS p
              WHERE
                p.id = $3
            )
          WHEN
            $4 IS NOT NULL
          THEN
            posts.created_at < (
              SELECT
                p.created_at
              FROM
                posts AS p
              WHERE
                p.id = $4
            )
          ELSE
            TRUE
        END
      )
    ORDER BY
      posts.created_at DESC
    LIMIT
      7
  ) AS p
), cmnts AS (
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
        comments, psts
      WHERE
        comments.post_id = psts.id
      ORDER BY
        comments.created_at DESC
      LIMIT
        3
    ) AS co
    ORDER BY
      co.created_at ASC
  ) AS c
), psts_obj AS (
  SELECT
    JSON_OBJECT_AGG(
      psts.id,
      JSON_BUILD_OBJECT(
        'id',
        psts.id,
        'channelId',
        psts.channel_id,
        'userId',
        psts.user_id,
        'content',
        psts.content,
        'upload',
        psts.upload,
        'author',
        psts.author,
        'createdAt',
        psts.created_at,
        'liked',
        psts.liked,
        'likeCount',
        psts.like_count,
        'commentCount',
        psts.comment_count,
        'selfCommentCount',
        psts.self_comment_count,
        'firstCommentId',
        psts.first_comment_id,
        'lastCommentId',
        psts.last_comment_id,
        'comments',
        (
          SELECT
            COALESCE(JSON_AGG(cmnts.id), '[]'::JSON)
          FROM
            cmnts
          WHERE
            cmnts.post_id = psts.id
        )
      )
    ) AS posts
  FROM
    psts
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
  psts_obj.posts,
  cmnts_obj.comments
FROM
  psts_obj, cmnts_obj
