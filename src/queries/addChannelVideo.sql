INSERT INTO channel_videos (channel_id, video_id, queue_position)
SELECT
  $1 AS "channel_id",
  $2 AS "video_id",
  (
    SELECT COUNT(*) 
    FROM channel_videos
    WHERE channel_videos.channel_id = $1
  ) AS "queue_position"
RETURNING
  id,
  video_id AS "videoId",
  queue_position AS "queuePosition"