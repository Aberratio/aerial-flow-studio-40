-- Add video_url column to posts table for video support
ALTER TABLE public.posts ADD COLUMN video_url TEXT;