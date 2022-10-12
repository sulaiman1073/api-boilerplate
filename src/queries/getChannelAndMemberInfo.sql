SELECT
  channels.type,
  channels.public "isPublic",
  channels.owner_id = $2 "isOwner",
  COALESCE(mem.admin, FALSE) "isAdmin",
  COALESCE(NOT(mem.banned), FALSE) "isMember",
  COALESCE(mem.banned, FALSE) "isBanned"
FROM
  channels
LEFT JOIN LATERAL (
  SELECT
    members.admin,
    members.banned
  FROM
    members
  WHERE
    members.channel_id = channels.id
    AND members.user_id = $2
) mem ON TRUE
WHERE
  id = $1
