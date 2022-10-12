INSERT INTO
  channels (
    type,
    name,
    description,
    icon,
    public,
    owner_id
  )
VALUES
  ($1, $2, $3, $4, COALESCE ($5, FALSE), $6)
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
