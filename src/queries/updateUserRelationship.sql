UPDATE
  user_relationships
SET
  type = $3,
  updated_at = NOW()
WHERE
  (
    (first_user_id = $1 AND second_user_id = $2)
    OR (first_user_id = $2 AND second_user_id = $1)
  ) AND type != $3
RETURNING
  *
