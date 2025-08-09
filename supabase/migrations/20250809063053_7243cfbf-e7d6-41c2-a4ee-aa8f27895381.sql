-- Update RLS policies for sport_levels table to allow everyone to view published levels

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Everyone can view sport levels" ON public.sport_levels;

-- Create new policy to allow everyone to view published sport levels
CREATE POLICY "Everyone can view published sport levels" 
ON public.sport_levels 
FOR SELECT 
USING (status = 'published');

-- Also allow admins to view all sport levels
CREATE POLICY "Admins can view all sport levels" 
ON public.sport_levels 
FOR SELECT 
USING (auth.uid() IN (
  SELECT id FROM public.profiles 
  WHERE role = 'admin'
));