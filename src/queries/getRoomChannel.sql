WITH chnl AS (
  SELECT
    channels.id,
    channels.type,
    channels.name,
    channels.public,
    channels.status,
    channels.queue_start_position,
    channels.video_start_time,
    channels.clock_start_time,
    channels.created_at,
    fm.id AS "fmid",
    lm.id AS "lmid",
    lm.created_at AS "lmdate",
    mems.member_ids AS "members",
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
      COALESCE(ARRAY_AGG(members.user_id), ARRAY[]::UUID[]) AS member_ids
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
), chnl_obj AS (
  SELECT
    JSON_BUILD_OBJECT(
      'id',
      chnl.id,
      'type',
      chnl.type,
      'name',
      chnl.name,
      'public',
      chnl.public,
      'createdAt',
      chnl.created_at,
      'firstMessageId',
      chnl.fmid,
      'lastMessageId',
      chnl.lmid,
      'lastMessageAt',
      chnl.lmdate,
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
      'messages',
      (
        SELECT
          COALESCE(JSON_AGG(msgs.id), '[]'::JSON)
        FROM
          msgs
        WHERE
          msgs.channel_id = chnl.id
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
    users.id = ANY (chnl.members)
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
)
SELECT
  chnl_obj.channel,
  usrs_obj.users,
  msgs_obj.messages
FROM
  chnl_obj, usrs_obj, msgs_obj
