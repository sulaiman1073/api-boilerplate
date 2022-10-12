WITH channel_post_ids AS (
	SELECT id
	FROM posts
	WHERE channel_id = $1
)
SELECT comments.id as commment_id , post_id as post_id
FROM comments, channel_post_ids
WHERE comments.post_id = channel_post_ids.id
	AND comments.created_at BETWEEN now() AND (now() - '50 hours'::INTERVAL);
