SELECT
  COALESCE(JSON_OBJECT_AGG(
    msgs2.id,
    JSON_BUILD_OBJECT(
      'id',
      msgs2.id,
      'userId',
      msgs2.user_id,
      'channelId',
      msgs2.channel_id,
      'content',
      msgs2.content,
      'upload',
      msgs2.upload,
      'createdAt',
      msgs2.created_at,
      'author',
      msgs2.author
    )
  ), '{}'::JSON) AS messages
FROM (
  SELECT
    *
  FROM (
    SELECT
      messages.id,
      messages.channel_id,
      messages.user_id,
      messages.content,
      messages.upload,
      messages.created_at,
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
          users.id = messages.user_id
      ) AS "author"
    FROM
      messages
    WHERE
      messages.channel_id = $1
      AND (
        CASE
          WHEN
            $3 IS NOT NULL AND $4 IS NOT NULL
          THEN
            (
              messages.created_at > (
                SELECT
                  m.created_at
                FROM
                  messages AS m
                WHERE
                  m.id = $3
              )
              AND
              messages.created_at < (
                SELECT
                  m.created_at
                FROM
                  messages AS m
                WHERE
                  m.id = $4
              )
            )
          WHEN
            $3 IS NOT NULL
          THEN
            messages.created_at > (
              SELECT
                m.created_at
              FROM
                messages AS m
              WHERE
                m.id = $3
            )
          WHEN
            $4 IS NOT NULL
          THEN
            messages.created_at < (
              SELECT
                m.created_at
              FROM
                messages AS m
              WHERE
                m.id = $4
            )
          ELSE
            TRUE
        END
      )
    ORDER BY
      CASE WHEN $3 IS NOT NULL AND $4 IS NOT NULL THEN messages.created_at END DESC,
      CASE WHEN $3 IS NOT NULL THEN messages.created_at END ASC,
      CASE WHEN $4 IS NOT NULL THEN messages.created_at END DESC,
      CASE WHEN $3 IS NULL AND $4 IS NULL THEN messages.created_at END DESC
    LIMIT
      50
  ) AS msgs
  WHERE
    EXISTS (
      SELECT
        1
      FROM
        channels
      JOIN
        members
      ON
        members.channel_id = channels.id
      WHERE
        channels.id = $1
        AND (
          (channels.public AND NOT (members.user_id = $2 AND members.banned))
          OR (NOT channels.public AND (members.user_id = $2 AND NOT members.banned))
        )
    )
  ORDER BY
    msgs.created_at ASC
) AS msgs2
