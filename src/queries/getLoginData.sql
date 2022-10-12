WITH self AS (
  SELECT
    *
  FROM
    users
  WHERE
    users.id = $1
    AND users.deleted_at IS NULL
), relats AS (
  SELECT
    COALESCE(
      NULLIF(ur.first_user_id, self.id), NULLIF(ur.second_user_id, self.id)
    ) AS user_id,
    (
      CASE
        WHEN
          (ur.type = 'friend_first_second' AND ur.first_user_id = self.id) OR
          (ur.type = 'friend_second_first' AND ur.second_user_id = self.id)
        THEN
          'sentFriendRequests'
        WHEN
          (ur.type = 'friend_first_second' AND ur.second_user_id = self.id) OR
          (ur.type = 'friend_second_first' AND ur.first_user_id = self.id)
        THEN
          'receivedFriendRequests'
        WHEN
          ur.type = 'friend_both'
        THEN
          'friends'
        WHEN
          (ur.type = 'block_first_second' AND ur.first_user_id = self.id) OR
          (ur.type = 'block_second_first' AND ur.second_user_id = self.id) OR
          (ur.type = 'block_both')
        THEN
          'blocked'
        WHEN
          (ur.type = 'block_first_second' AND ur.second_user_id = self.id) OR
          (ur.type = 'block_second_first' AND ur.first_user_id = self.id) OR
          (ur.type = 'block_both')
        THEN
          'blockers'
      END
    ) relationship
  FROM
    user_relationships AS ur, self
  WHERE
    ur.first_user_id = self.id
    OR ur.second_user_id = self.id
), relationships_cte AS (
  SELECT
    COALESCE(ARRAY_AGG(relats.user_id) FILTER (WHERE relats.relationship = 'friends'), ARRAY[]::UUID[]) AS "friends",
    COALESCE(ARRAY_AGG(relats.user_id) FILTER (WHERE relats.relationship = 'sentFriendRequests'), ARRAY[]::UUID[]) AS "sentFriendRequests",
    COALESCE(ARRAY_AGG(relats.user_id) FILTER (WHERE relats.relationship = 'receivedFriendRequests'), ARRAY[]::UUID[]) AS "receivedFriendRequests",
    COALESCE(ARRAY_AGG(relats.user_id) FILTER (WHERE relats.relationship = 'blocked'), ARRAY[]::UUID[]) AS "blocked",
    COALESCE(ARRAY_AGG(relats.user_id) FILTER (WHERE relats.relationship = 'blockers'), ARRAY[]::UUID[]) AS "blockers"
  FROM
    relats
), relationships_obj AS (
  SELECT
    JSON_BUILD_OBJECT(
      'friends',
      relationships_cte."friends",
      'sentFriendRequests',
      relationships_cte."sentFriendRequests",
      'receivedFriendRequests',
      relationships_cte."receivedFriendRequests",
      'blocked',
      relationships_cte."blocked",
      'blockers',
      relationships_cte."blockers"
    ) AS relationships
  FROM
    relationships_cte
), chans AS (
  SELECT
    members.channel_id,
    members.admin
  FROM
    members, self
  WHERE
    members.user_id = self.id
  UNION
  SELECT
    follow_requests.channel_id,
    false AS admin
  FROM
    follow_requests, self
  where
    follow_requests.user_id = self.id
  ), channels_cte AS (
  SELECT
    channels.id,
    channels.type,
    channels.name,
    channels.description,
    channels.icon,
    channels.public,
    channels.owner_id,
    channels.created_at,
    fm.id AS first_message_id,
    lm.id AS last_message_id,
    lm.created_at AS last_message_at,
    lm.content AS last_message_content,
    lm.username AS last_message_username,
    (
      SELECT
        ARRAY_AGG(members.user_id)
      FROM
        members
      WHERE
        members.channel_id = channels.id
    ) AS members,
    (
      CASE
        WHEN
          channels.type = 'friend' OR
          channels.type = 'group'
        THEN (
            SELECT
              channel_id
            FROM
              chat_notifications
            WHERE
              chat_notifications.channel_id = channels.id AND chat_notifications.user_id = $1
        )
        ELSE
          NULL
      END
    ) AS chat_notifications
  FROM
    channels
  JOIN
    chans
  ON
    channels.id = chans.channel_id
  LEFT JOIN LATERAL (
    SELECT
      messages.id
    FROM
      messages
    WHERE
      messages.channel_id = channels.id
    ORDER BY
      messages.created_at ASC
    LIMIT
      1
  ) fm ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      messages.id,
      messages.created_at,
      messages.content,
      (
        SELECT
          users.username
        FROM
          users
        WHERE
          users.id = messages.user_id
      )
    FROM
      messages
    WHERE
      messages.channel_id = channels.id
    ORDER BY
      messages.created_at DESC
    LIMIT
      1
  ) lm ON TRUE
), channels_obj AS (
  SELECT
    JSON_OBJECT_AGG(
      channels_cte.id,
      JSON_BUILD_OBJECT(
        'id',
        channels_cte.id,
        'type',
        channels_cte.type,
        'name',
        channels_cte.name,
        'description',
        channels_cte.description,
        'icon',
        channels_cte.icon,
        'public',
        channels_cte.public,
        'ownerId',
        channels_cte.owner_id,
        'createdAt',
        channels_cte.created_at,
        'firstMessageId',
        channels_cte.first_message_id,
        'lastMessageId',
        channels_cte.last_message_id,
        'lastMessageAt',
        channels_cte.last_message_at,
        'lastMessageUsername',
        channels_cte.last_message_username,
        'lastMessageContent',
        channels_cte.last_message_content,
        'members',
        channels_cte.members,
        'chatNotifications',
        channels_cte.chat_notifications
      )
    ) AS channels
  FROM
    channels_cte
), user_ids AS (
  SELECT
    ARRAY_AGG(u) AS user_ids
  FROM (
    SELECT DISTINCT
      u
    FROM
      channels_cte AS c,
      relationships_cte as r,
      UNNEST(
        c.members ||
        r."friends" ||
        r."sentFriendRequests" ||
        r."receivedFriendRequests" ||
        r."blocked" ||
        r."blockers"
      ) AS u
  ) x
), users_obj AS (
  SELECT
    JSON_OBJECT_AGG(
      users.id,
      JSON_BUILD_OBJECT(
        'username',
        users.username,
        'firstName',
        users.first_name,
        'lastName',
        users.last_name,
        'avatar',
        users.avatar
      )
    ) AS users
  FROM
    users, user_ids
  WHERE
    users.id = ANY (user_ids.user_ids)
)
SELECT
  self.id,
  self.first_name AS "firstName",
  self.last_name AS "lastName",
  self.username AS "username",
  self.date_of_birth AS "dateOfBirth",
  self.avatar AS "avatar",
  self.email AS "email",
  self.email_verified AS "emailVerified",
  self.created_at AS "createdAt",
  channels_obj.channels,
  relationships_obj.relationships,
  COALESCE(users_obj.users, '{}'::JSON) AS users
FROM
  self, relationships_obj, channels_obj, users_obj
