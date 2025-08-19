-- Drop the existing update policy for trainers if it exists
DROP POLICY IF EXISTS "Trainers can update their own figures" ON public.figures;

-- Allow admins to update any figures (including premium toggle)
CREATE POLICY "Admins can update any figures"
ON public.figures
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT profiles.id FROM public.profiles WHERE profiles.role = 'admin'::user_role
  )
);

-- Allow trainers to update their own figures (but not premium)
CREATE POLICY "Trainers can update their own figures" 
ON public.figures
FOR UPDATE
USING (
  (auth.uid() = created_by) AND 
  (auth.uid() IN (
    SELECT profiles.id FROM public.profiles WHERE profiles.role = 'trainer'::user_role
  ))
);