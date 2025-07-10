-- Add status column to challenges table to support draft/published states
ALTER TABLE public.challenges 
ADD COLUMN status text NOT NULL DEFAULT 'draft';

-- Add check constraint for valid status values
ALTER TABLE public.challenges 
ADD CONSTRAINT challenges_status_check 
CHECK (status IN ('draft', 'published'));

-- Update RLS policy for viewing challenges to only show published ones for regular users
DROP POLICY IF EXISTS "Users can view all challenges" ON public.challenges;

CREATE POLICY "Users can view published challenges" 
ON public.challenges 
FOR SELECT 
USING (status = 'published');

-- Allow trainers and admins to view all challenges (including drafts)
CREATE POLICY "Trainers can view all challenges" 
ON public.challenges 
FOR SELECT 
USING (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role]))));

-- Allow trainers and admins to update challenges
CREATE POLICY "Trainers can update challenges" 
ON public.challenges 
FOR UPDATE 
USING (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role]))));

-- Allow trainers and admins to delete challenges
CREATE POLICY "Trainers can delete challenges" 
ON public.challenges 
FOR DELETE 
USING (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role]))));