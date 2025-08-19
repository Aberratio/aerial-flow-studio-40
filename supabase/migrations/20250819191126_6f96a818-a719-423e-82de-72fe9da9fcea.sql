-- Allow admins to update any figures (so they can toggle premium, etc.)
CREATE POLICY IF NOT EXISTS "Admins can update any figures"
ON public.figures
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT profiles.id FROM public.profiles WHERE profiles.role = 'admin'::user_role
  )
);
