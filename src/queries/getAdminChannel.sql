WITH chnl AS (
  SELECT
    channels.id,
    channels.type,
    channels.name,
    channels.description,
    channels.icon,
    channels.public,
    channels.status,
    channels.queue_start_position,
    channels.video_start_time,
    channels.clock_start_time,
    channels.owner_id,
    channels.created_at,
    fm.id AS "fmid",
    lm.id AS "lmid",
    lm.created_at AS "lmdate",
    fp.id AS "fpid",
    lp.id AS "lpid",
    lp.created_at AS "lpdate",
    mems.member_ids AS "members",
    mems.admin_ids AS "admins",
    mems.banned_ids AS "banned",
    que.queue
  FROM
    channels
  LEFT JOIN LATERAL (
    SELECT
      messages.id
    FROM
      messages
    WHERE
      messages.channel_id = channels.id
    ORDER BY
      messages.created_at ASC
    LIMIT
      1
  ) fm ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      messages.id,
      messages.created_at
    FROM
      messages
    WHERE
      messages.channel_id = channels.id
    ORDER BY
      messages.created_at DESC
    LIMIT
      1
  ) lm ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      posts.id
    FROM
      posts
    WHERE
      posts.channel_id = channels.id
    ORDER BY
      posts.created_at ASC
    LIMIT
      1
  ) fp ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      posts.id,
      posts.created_at
    FROM
      posts
    WHERE
      posts.channel_id = channels.id
    ORDER BY
      posts.created_at DESC
    LIMIT
      1
  ) lp ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(ARRAY_AGG(members.user_id) FILTER (WHERE NOT banned), ARRAY[]::UUID[]) AS member_ids,
      COALESCE(ARRAY_AGG(members.user_id) FILTER (WHERE admin), ARRAY[]::UUID[]) AS admin_ids,
      COALESCE(ARRAY_AGG(members.user_id) FILTER (WHERE banned), ARRAY[]::UUID[]) AS banned_ids
    FROM
      members
    WHERE
      members.channel_id = channels.id
  ) mems ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      COALESCE(
        JSON_AGG(
        JSON_BUILD_OBJECT(
          'id',
          q.id,
          'channelId',
          q.channel_id,
          'videoId',
          q.video_id,
          'length',
          q.length,
          'videoInfo',
          q.video_info,
          'title',
          q.video_info->>'title',
          'publishedAt',
          q.video_info->>'publishedAt',
          'thumbnail',
          q.video_info->>'thumbnail',
          'url',
          q.video_info->>'url'
        )), '[]'::JSON) AS "queue"
    FROM (
      SELECT
        channel_videos.id,
        channel_videos.channel_id,
        channel_videos.video_id,
        videos.length,
        videos.video_info
      FROM
        channel_videos
      JOIN
        videos
      ON
        videos.id = channel_videos.video_id
      WHERE
        channel_videos.channel_id = channels.id
      ORDER BY
        channel_videos.queue_position ASC
    ) AS q
  ) que ON TRUE
  WHERE
    channels.id = $1
), msgs AS (
  SELECT
    *
  FROM (
    SELECT
      messages.*,
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
      ) AS author
    FROM
      messages, chnl
    WHERE
      messages.channel_id = chnl.id
    ORDER BY
      messages.created_at DESC
    LIMIT
      50
  )  AS m
  ORDER BY
    m.created_at ASC
), psts AS (
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
      posts, chnl
    WHERE
      posts.channel_id = chnl.id
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
      co.*
    FROM
      psts
    JOIN LATERAL (
      SELECT
        comments.*
      FROM
        comments
      WHERE
        comments.post_id = psts.id
      ORDER BY
        comments.created_at DESC
      LIMIT
        3
    ) co ON TRUE
    ORDER BY
      co.created_at ASC
  ) AS c
), chnl_obj AS (
  SELECT
    JSON_BUILD_OBJECT(
      'id',
      chnl.id,
      'type',
      chnl.type,
      'name',
      chnl.name,
      'description',
      chnl.description,
      'icon',
      chnl.icon,
      'public',
      chnl.public,
      'ownerId',
      chnl.owner_id,
      'createdAt',
      chnl.created_at,
      'firstMessageId',
      chnl.fmid,
      'lastMessageId',
      chnl.lmid,
      'lastMessageAt',
      chnl.lmdate,
      'firstPostId',
      chnl.fpid,
      'lastPostId',
      chnl.lpid,
      'lastPostAt',
      chnl.lpdate,
      'status',
      chnl.status,
      'queueStartPosition',
      chnl.queue_start_position,
      'videoStartTime',
      chnl.video_start_time,
      'clockStartTime',
      chnl.clock_start_time,
      'members',
      chnl.members,
      'admins',
      chnl.admins,
      'banned',
      chnl.banned,
      'messages',
      (
        SELECT
          COALESCE(JSON_AGG(msgs.id), '[]'::JSON)
        FROM
          msgs
        WHERE
          msgs.channel_id = chnl.id
      ),
      'posts',
      (
        SELECT
          COALESCE(JSON_AGG(psts.id), '[]'::JSON)
        FROM
          psts
        WHERE
          psts.channel_id = chnl.id
      ),
      'queue',
      chnl.queue
  ) AS channel
  FROM
    chnl
), usrs_obj AS (
  SELECT
    JSON_OBJECT_AGG(
      users.id,
      JSON_BUILD_OBJECT(
        'id',
        users.id,
        'firstName',
        users.first_name,
        'lastName',
        users.last_name,
        'username',
        users.username,
        'avatar',
        users.avatar
      )
    ) AS users
  FROM
    users, chnl
  WHERE
    users.id = ANY (chnl.members || chnl.banned)
), msgs_obj AS (
  SELECT
    JSON_OBJECT_AGG(
      msgs.id,
      JSON_BUILD_OBJECT(
        'id',
        msgs.id,
        'userId',
        msgs.user_id,
        'channelId',
        msgs.channel_id,
        'content',
        msgs.content,
        'upload',
        msgs.upload,
        'createdAt',
        msgs.created_at,
        'author',
        msgs.author
      )
    ) AS messages
  FROM
    msgs
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
  chnl_obj.channel,
  usrs_obj.users,
  msgs_obj.messages,
  psts_obj.posts,
  cmnts_obj.comments
FROM
  chnl_obj, usrs_obj, msgs_obj, psts_obj, cmnts_obj
