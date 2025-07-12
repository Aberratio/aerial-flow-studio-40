-- Add rejection tracking to friendships table
ALTER TABLE public.friendships ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE NULL;

-- Update existing status enum to include rejected status (if needed)
-- This will help track rejections explicitly