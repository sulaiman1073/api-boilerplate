DELETE FROM
  channels
WHERE
  type = 'channel'
  AND id = $1
  AND owner_id = $2
RETURNING
  id AS "channelId"
