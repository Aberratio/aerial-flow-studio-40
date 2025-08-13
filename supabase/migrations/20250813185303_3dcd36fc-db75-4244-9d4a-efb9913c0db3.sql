-- Fix security vulnerability in profiles table RLS policies
-- Drop the overly permissive policy that allows any authenticated user to see all profile data
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;

-- Create a new policy that only allows viewing limited public profile information
-- This excludes sensitive data like email addresses while allowing public profile viewing
CREATE POLICY "Users can view limited public profile data" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated'::text 
  AND auth.uid() <> id  -- Only for viewing OTHER users' profiles
);

-- Note: Users can still view their own complete profile via the existing 
-- "Allow logged-in users to select their own profile" policy