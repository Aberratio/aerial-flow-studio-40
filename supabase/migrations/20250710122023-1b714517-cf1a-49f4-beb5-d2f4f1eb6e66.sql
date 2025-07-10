-- Create friendships table for friend requests and relationships
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Create index for better performance
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Enable RLS on friendships table
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for friendships
CREATE POLICY "Users can view their own friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're involved in" 
ON public.friendships 
FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their own friend requests" 
ON public.friendships 
FOR DELETE 
USING (auth.uid() = requester_id);

-- Remove status column from user_follows (following is now immediate)
ALTER TABLE public.user_follows DROP COLUMN IF EXISTS status;

-- Update posts table to include 'friends' privacy option
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_privacy_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_privacy_check 
CHECK (privacy IN ('public', 'friends', 'private'));

-- Create trigger for friendships updated_at
CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if users are friends
CREATE OR REPLACE FUNCTION public.are_users_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND (
      (requester_id = user1_id AND addressee_id = user2_id) OR
      (requester_id = user2_id AND addressee_id = user1_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;