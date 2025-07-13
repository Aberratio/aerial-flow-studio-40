-- Add constraint to prevent duplicate friendships regardless of order
-- This ensures that for any two users A and B, there can only be one friendship record

-- First, let's create a function to ensure consistent ordering of user IDs
CREATE OR REPLACE FUNCTION public.friendship_user_pair(user1_id UUID, user2_id UUID)
RETURNS UUID[] AS $$
BEGIN
  -- Always return the smaller UUID first to ensure consistent ordering
  IF user1_id < user2_id THEN
    RETURN ARRAY[user1_id, user2_id];
  ELSE
    RETURN ARRAY[user2_id, user1_id];
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a unique constraint that prevents duplicate friendships regardless of requester/addressee order
-- We'll use a partial unique index that considers both directions
CREATE UNIQUE INDEX idx_friendships_unique_pair 
ON public.friendships (
  LEAST(requester_id, addressee_id), 
  GREATEST(requester_id, addressee_id)
) 
WHERE status IN ('pending', 'accepted');

-- Also prevent users from sending friend requests to themselves
ALTER TABLE public.friendships 
ADD CONSTRAINT check_no_self_friendship 
CHECK (requester_id != addressee_id);