-- Update the RLS policy for figures to restrict visibility of special training exercises
-- Only allow admins and experts of the specific exercise to see warm_up and stretching category exercises

-- Drop and recreate the existing policy to include the new restriction
DROP POLICY IF EXISTS "Users can view all figures" ON public.figures;

CREATE POLICY "Users can view figures with training restrictions" 
ON public.figures 
FOR SELECT 
USING (
  -- Admin users can see all figures
  (auth.uid() IN ( SELECT profiles.id FROM profiles WHERE profiles.role = 'admin'::user_role)) OR
  -- Non-special figures (not warm_up or stretching category) are visible to everyone
  (category NOT IN ('warm_up', 'stretching')) OR
  -- For special figures, only allow if user is an expert for this figure
  (category IN ('warm_up', 'stretching') AND auth.uid() IN (
    SELECT fe.expert_user_id 
    FROM figure_experts fe 
    WHERE fe.figure_id = figures.id
  ))
);