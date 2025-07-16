-- Add sports field to profiles table for user sports selection
ALTER TABLE public.profiles ADD COLUMN sports text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.sports IS 'Array of sports/activities that the user trains in';