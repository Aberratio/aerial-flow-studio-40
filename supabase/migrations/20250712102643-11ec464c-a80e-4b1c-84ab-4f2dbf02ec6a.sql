-- Create figure_experts table to track experts for each figure
CREATE TABLE public.figure_experts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  figure_id UUID NOT NULL REFERENCES public.figures(id) ON DELETE CASCADE,
  expert_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(figure_id, expert_user_id)
);

-- Enable RLS on figure_experts
ALTER TABLE public.figure_experts ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view figure experts
CREATE POLICY "Everyone can view figure experts" 
ON public.figure_experts 
FOR SELECT 
USING (true);

-- Only admins and figure creators can add experts
CREATE POLICY "Admins and figure creators can add experts" 
ON public.figure_experts 
FOR INSERT 
WITH CHECK (
  auth.uid() = added_by AND (
    auth.uid() IN (
      SELECT profiles.id FROM profiles 
      WHERE profiles.role = 'admin'::user_role
    ) OR 
    auth.uid() IN (
      SELECT figures.created_by FROM figures 
      WHERE figures.id = figure_id
    )
  )
);

-- Only admins and figure creators can remove experts
CREATE POLICY "Admins and figure creators can remove experts" 
ON public.figure_experts 
FOR DELETE 
USING (
  auth.uid() IN (
    SELECT profiles.id FROM profiles 
    WHERE profiles.role = 'admin'::user_role
  ) OR 
  auth.uid() IN (
    SELECT figures.created_by FROM figures 
    WHERE figures.id = figure_id
  )
);

-- Create trigger for updating updated_at
CREATE TRIGGER update_figure_experts_updated_at
  BEFORE UPDATE ON public.figure_experts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();