WITH chnl AS (
  SELECT
    channels.id,
    channels.type,
    channels.name,
    channels.description,
    channels.icon,
    channels.public,
    channels.status,
    channels.owner_id,
    channels.created_at,
    mems.admin_ids AS "admins",
    mems.member_count AS "member_count",
    que.queue
  FROM
    channels
  LEFT JOIN LATERAL (
    SELECT
      COUNT(members.user_id) FILTER (WHERE NOT banned) AS member_count,
      COALESCE(ARRAY_AGG(members.user_id) FILTER (WHERE admin), ARRAY[]::UUID[]) AS admin_ids
    FROM
      members
    WHERE
      members.channel_id = channels.id
  ) mems ON TRUE
  WHERE
    channels.id = $1
), chnl_obj AS (
  SELECT
    JSON_BUILD_OBJECT(
      'id',
      chnl.id,
      'type',
      chnl.type,
      'name',
      chnl.name,
      'description',
      chnl.description,
      'icon',
      chnl.icon,
      'public',
      chnl.public,
      'ownerId',
      chnl.owner_id,
      'createdAt',
      chnl.created_at,
      'admins',
      chnl.admins,
      'memberCount',
      chnl.member_count
  ) AS channel
  FROM
    chnl
), usrs_obj AS (
  SELECT
    JSON_OBJECT_AGG(
      users.id,
      JSON_BUILD_OBJECT(
        'id',
        users.id,
        'firstName',
        users.first_name,
        'lastName',
        users.last_name,
        'username',
        users.username,
        'avatar',
        users.avatar
      )
    ) AS users
  FROM
    users, chnl
  WHERE
    users.id = ANY (chnl.admins)
)
SELECT
  chnl_obj.channel,
  usrs_obj.users
FROM
  chnl_obj, usrs_obj
