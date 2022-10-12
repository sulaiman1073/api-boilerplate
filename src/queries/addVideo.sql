INSERT INTO videos (id, length, video_info)
VALUES($1, $2, $3) 
ON CONFLICT (id) 
DO 
UPDATE SET video_info = $3
RETURNING
  length,
  video_info AS "videoInfo"