SELECT
  COALESCE(JSON_OBJECT_AGG(
    chans.id,
    JSON_BUILD_OBJECT(
      'name',
      chans.name,
      'icon',
      chans.icon,
      'playbackStatus',
      chans.status,
      'videoInfo',
      (
        SELECT
          CASE
            WHEN
              chans.status = 'Ended'
            THEN
              NULL
            WHEN
              chans.status = 'Paused'
            THEN (
              SELECT
                videos.video_info
              FROM
                videos
              JOIN
                channel_videos
              ON
                channel_videos.channel_id = chans.id
                AND channel_videos.queue_position = chans.queue_start_position
                AND videos.id = channel_videos.video_id
            )
            WHEN
              chans.status = 'Playing'
            THEN (
              SELECT
                vids.video_info
              FROM (
                SELECT
                  x.*,
                  SUM(x.length) OVER () AS quelen,
                  SUM(x.cumlen) FILTER (WHERE queue_position = chans.queue_start_position) OVER () AS startlen
                FROM (
                  SELECT
                    videos.length,
                    videos.video_info,
                    SUM(videos.length) OVER (ORDER BY channel_videos.queue_position) AS cumlen,
                    channel_videos.queue_position
                  FROM
                    videos
                  JOIN
                    channel_videos
                  ON
                    channel_videos.video_id = videos.id
                  WHERE
                    channel_videos.channel_id = chans.id
                  ORDER BY
                    channel_videos.queue_position
                ) AS x
              ) AS vids
              WHERE
                vids.cumlen - chans.video_start_time >
                ((EXTRACT(epoch FROM (NOW() - chans.clock_start_time))::BIGINT % (vids.quelen + 1)) + vids.startlen)
              LIMIT
                1
            )
          END
      )
    )
  ), '{}'::JSON) AS "channels"
FROM
  channels AS chans
WHERE
  chans.public
  AND chans.id IN (
    SELECT
      *
    FROM
      unnest($1::UUID[])
  )
  AND EXISTS (
    SELECT
      1
    FROM
      members
    WHERE
      members.channel_id = chans.id
      AND NOT (members.user_id = $2 AND members.banned)
)
