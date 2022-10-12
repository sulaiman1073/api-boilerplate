WITH chan_mems AS(
  SELECT user_id
  FROM members
  WHERE members.channel_id = $1
)
SELECT avatar
FROM users, chan_mems
WHERE users.id = chan_mems.user_id
