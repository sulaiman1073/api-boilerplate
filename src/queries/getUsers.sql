SELECT
  COALESCE(JSON_OBJECT_AGG(
    users.id,
    JSON_BUILD_OBJECT(
      'firstName',
      users.first_name,
      'lastName',
      users.last_name,
      'username',
      users.username,
      'avatar',
      users.avatar
    )
  ), '{}'::JSON) AS "users"
FROM
  users
WHERE
  users.id IN (
    SELECT
      *
    FROM
      unnest($1::UUID[])
  )
