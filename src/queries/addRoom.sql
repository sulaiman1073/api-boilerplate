INSERT INTO
  channels (type)
VALUES
  ($1)
RETURNING
  id,
  type,
  name,
  description,
  icon,
  public,
  owner_id AS "ownerId",
  created_at AS "createdAt",
  NULL AS "firstMessageId",
  NULL AS "lastMessageId",
  NULL AS "lastMessageAt"
