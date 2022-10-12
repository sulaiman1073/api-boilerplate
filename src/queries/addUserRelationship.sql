INSERT INTO
  user_relationships (
    first_user_id,
    second_user_id,
    type
  )
VALUES (
  least($1, $2)::UUID,
  greatest($1, $2)::UUID,
  CASE
    WHEN
      $1 < $2
      AND $3 = 'friend'
    THEN
      'friend_first_second'
    WHEN
      $1 > $2
      AND $3 = 'friend'
    THEN
      'friend_second_first'
    WHEN
      $1 < $2
      AND $3 = 'block'
    THEN
      'block_first_second'
    WHEN
      $1 > $2
      AND $3 = 'block'
    THEN
      'block_second_first'
  END
)
RETURNING
  *
