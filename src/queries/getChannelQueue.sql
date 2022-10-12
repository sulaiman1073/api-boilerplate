SELECT
  COALESCE(JSON_AGG(
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
    )
  ), '[]'::JSON) AS "queue"
FROM (
  SELECT
    channel_videos.id AS id,
    channel_videos.channel_id AS channel_id,
    channel_videos.video_id AS video_id,
    videos.length AS length,
    videos.video_info AS video_info
  FROM
      channel_videos
  JOIN
    videos
  ON
    videos.id = channel_videos.video_id
  WHERE
    channel_videos.channel_id = $1
  ORDER BY
    channel_videos.queue_position ASC
) AS q

