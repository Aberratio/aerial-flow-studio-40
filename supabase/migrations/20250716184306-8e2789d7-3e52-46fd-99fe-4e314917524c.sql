-- Add last login timestamp and visits counter to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Create function to update login tracking
CREATE OR REPLACE FUNCTION public.update_user_login_tracking(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_login_at = now(),
    login_count = COALESCE(login_count, 0) + 1,
    updated_at = now()
  WHERE id = user_id;
END;
$$;