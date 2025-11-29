-- Remove Instagram integration columns from posts table
ALTER TABLE public.posts
DROP COLUMN IF EXISTS instagram_url,
DROP COLUMN IF EXISTS instagram_embed_html;