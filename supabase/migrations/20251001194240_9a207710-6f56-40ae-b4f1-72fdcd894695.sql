-- Add Instagram integration columns to posts table
ALTER TABLE public.posts
ADD COLUMN instagram_url text,
ADD COLUMN instagram_embed_html text;