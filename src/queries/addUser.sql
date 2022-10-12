WITH new_user AS (
  INSERT INTO
    users (first_name, last_name, username, email, date_of_birth, password)
  VALUES
    ($1, $2, $3, $4, $5, $6)
  ON CONFLICT
    DO NOTHING
  RETURNING
    id AS "id",
    first_name AS "firstName",
    last_name AS "lastName",
    username AS "username",
    date_of_birth AS "dateOfBirth",
    avatar AS "avatar",
    email AS "email",
    email_verified AS "emailVerified",
    created_at AS "createdAt"
)
  SELECT
    *,
    TRUE AS "newUser"
  FROM
    new_user
UNION ALL
  SELECT
    id AS "id",
    first_name AS "firstName",
    last_name AS "lastName",
    username AS "username",
    date_of_birth AS "dateOfBirth",
    avatar AS "avatar",
    email AS "email",
    email_verified AS "emailVerified",
    created_at AS "createdAt",
    FALSE AS "newUser"
  FROM
    users
  WHERE
    username = $3
    OR email = $4
  LIMIT
    1
