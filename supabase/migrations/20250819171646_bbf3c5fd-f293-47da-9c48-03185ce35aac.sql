-- Create similar exercises table for many-to-many relationships
CREATE TABLE public.similar_figures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  figure_id UUID NOT NULL,
  similar_figure_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure we don't have duplicate pairs and self-references
  CONSTRAINT similar_figures_no_self_reference CHECK (figure_id != similar_figure_id),
  CONSTRAINT similar_figures_unique_pair UNIQUE (figure_id, similar_figure_id)
);

-- Enable RLS
ALTER TABLE public.similar_figures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view similar figures"
ON public.similar_figures
FOR SELECT
USING (true);

CREATE POLICY "Trainers and admins can manage similar figures"
ON public.similar_figures
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role IN ('trainer', 'admin')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role IN ('trainer', 'admin')
  )
);

-- Create function to automatically create bidirectional relationships
CREATE OR REPLACE FUNCTION public.create_bidirectional_similarity()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the reverse relationship if it doesn't exist
  INSERT INTO public.similar_figures (figure_id, similar_figure_id, created_by)
  VALUES (NEW.similar_figure_id, NEW.figure_id, NEW.created_by)
  ON CONFLICT (figure_id, similar_figure_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for bidirectional relationships
CREATE TRIGGER create_bidirectional_similarity_trigger
  AFTER INSERT ON public.similar_figures
  FOR EACH ROW
  EXECUTE FUNCTION public.create_bidirectional_similarity();