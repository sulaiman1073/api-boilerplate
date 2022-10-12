WITH common_channels AS (
  (
    SELECT
      channel_id
    FROM
      members
    WHERE
      user_id = $1
  )
  INTERSECT
  (
    SELECT
      channel_id
    FROM
      members
    WHERE
      user_id = $2
  )
)
DELETE FROM
  channels
WHERE
  id IN (
  SELECT
    channels.id
  FROM
    channels
  JOIN
    common_channels
  ON
    common_channels.channel_id = channels.id
  WHERE
    channels.type = 'friend'
  )
RETURNING
  *


