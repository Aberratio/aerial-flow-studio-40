-- Create table to link training days with exercises
CREATE TABLE public.training_day_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_day_id UUID NOT NULL REFERENCES public.challenge_training_days(id) ON DELETE CASCADE,
  figure_id UUID NOT NULL REFERENCES public.figures(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  sets INTEGER,
  reps INTEGER,
  hold_time_seconds INTEGER,
  rest_time_seconds INTEGER,
  video_url TEXT,
  audio_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_day_exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for training_day_exercises
CREATE POLICY "Everyone can view training day exercises" 
ON public.training_day_exercises 
FOR SELECT 
USING (true);

CREATE POLICY "Trainers can manage training day exercises" 
ON public.training_day_exercises 
FOR ALL 
USING (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role]))));

-- Update figures table policies to allow trainers to delete their own figures
CREATE POLICY "Trainers can delete their own figures" 
ON public.figures 
FOR DELETE 
USING ((auth.uid() = created_by) AND (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role])))));

-- Allow admins to delete any figures
CREATE POLICY "Admins can delete any figures" 
ON public.figures 
FOR DELETE 
USING (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = 'admin'::user_role)));

-- Create index for better performance
CREATE INDEX idx_training_day_exercises_training_day_id ON public.training_day_exercises(training_day_id);
CREATE INDEX idx_training_day_exercises_order_index ON public.training_day_exercises(training_day_id, order_index);