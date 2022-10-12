SELECT
  first_user_id AS "firstUserId",
  second_user_id AS "secondUserId",
  type,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
FROM
  user_relationships
WHERE
  (first_user_id = $1 AND second_user_id = $2)
  OR (first_user_id = $2 AND second_user_id = $1)
