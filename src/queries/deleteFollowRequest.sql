DELETE FROM
  follow_request
WHERE
  channel_id = $1
  AND user_id = $2
