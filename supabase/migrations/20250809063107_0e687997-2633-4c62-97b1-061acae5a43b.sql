-- Create security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all sport levels" ON public.sport_levels;

-- Create new policy using the security definer function
CREATE POLICY "Admins can view all sport levels" 
ON public.sport_levels 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');