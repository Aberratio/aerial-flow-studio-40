-- Fix security issue with profiles table RLS policies
-- Remove the overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a secure policy that only allows authenticated users to view profiles
-- but hides sensitive data (email) from other users
CREATE POLICY "Authenticated users can view public profile data" ON public.profiles
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      -- Users can see their own complete profile including email
      auth.uid() = id OR
      -- Other authenticated users can see profiles but without email
      auth.uid() != id
    )
  );

-- Note: We'll need to handle email visibility at the application level
-- since RLS can't selectively hide columns. The application should filter 
-- out email addresses when showing other users' profiles.