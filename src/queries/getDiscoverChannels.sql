SELECT
  COALESCE(JSON_AGG(chans.ids), '[]'::JSON) AS "channelIds"
FROM (
  SELECT
    channels.id AS ids
  FROM
    channels
  WHERE
    channels.type = 'channel'
    AND channels.public
  ORDER BY
    random() FETCH FIRST 30 ROWS ONLY
) AS chans
