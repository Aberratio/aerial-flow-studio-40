-- Add privacy column to posts table
ALTER TABLE public.posts 
ADD COLUMN privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private'));