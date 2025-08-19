-- Add RLS policy to allow viewing profiles of figure experts
CREATE POLICY "Users can view profiles of figure experts" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND id IN (
    SELECT expert_user_id 
    FROM figure_experts
  )
);