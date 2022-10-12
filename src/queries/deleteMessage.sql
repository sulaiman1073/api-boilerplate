WITH dm AS (
  DELETE FROM
    messages
  WHERE
    messages.id = $1
  AND (
    messages.user_id = $2
    OR EXISTS (
    SELECT
      1
    FROM
      members
    WHERE
      members.channel_id = messages.channel_id
      AND members.user_id = $2
      AND members.admin
    )
  )
  RETURNING
  id AS "messageId",
  channel_id AS "channelId"
), fm AS (
  SELECT
    messages.id AS "firstMessageId"
  FROM
    messages, dm
  WHERE
    messages.channel_id = dm."channelId"
    AND messages.id != dm."messageId"
  ORDER BY
    messages.created_at ASC
  LIMIT
    1
), lm AS (
  SELECT
    messages.id AS "lastMessageId",
    messages.created_at AS "lastMessageAt"
  FROM
    messages, dm
  WHERE
    messages.channel_id = dm."channelId"
    AND messages.id != dm."messageId"
  ORDER BY
    messages.created_at DESC
  LIMIT
    1
)
SELECT
  *
FROM
  dm
LEFT JOIN fm ON TRUE
LEFT JOIN lm ON TRUE
