-- Create table for prerequisite figures
CREATE TABLE public.prerequisite_figures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  figure_id UUID NOT NULL,
  prerequisite_figure_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(figure_id, prerequisite_figure_id)
);

-- Enable Row Level Security
ALTER TABLE public.prerequisite_figures ENABLE ROW LEVEL SECURITY;

-- Create policies for prerequisite figures
CREATE POLICY "Everyone can view prerequisite figures" 
ON public.prerequisite_figures 
FOR SELECT 
USING (true);

CREATE POLICY "Trainers and admins can manage prerequisite figures" 
ON public.prerequisite_figures 
FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM profiles 
  WHERE role IN ('trainer', 'admin')
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles 
  WHERE role IN ('trainer', 'admin')
));