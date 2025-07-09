
-- Create progress tracking table for exercise statuses
CREATE TABLE IF NOT EXISTS public.figure_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  figure_id UUID NOT NULL REFERENCES public.figures(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_tried' CHECK (status IN ('completed', 'for_later', 'failed', 'not_tried')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(user_id, figure_id)
);

-- Enable RLS
ALTER TABLE public.figure_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own progress"
  ON public.figure_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
  ON public.figure_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.figure_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.figure_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_figure_progress_updated_at
  BEFORE UPDATE ON public.figure_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_figure_progress_user_figure ON public.figure_progress(user_id, figure_id);
CREATE INDEX idx_figure_progress_status ON public.figure_progress(status);
