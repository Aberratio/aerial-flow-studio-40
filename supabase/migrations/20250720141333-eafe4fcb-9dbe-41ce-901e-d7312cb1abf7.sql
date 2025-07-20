-- Create table for tracking challenge day progress
CREATE TABLE public.challenge_day_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL,
  training_day_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exercises_completed INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, training_day_id)
);

-- Enable Row Level Security
ALTER TABLE public.challenge_day_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for challenge day progress
CREATE POLICY "Users can create their own challenge day progress" 
ON public.challenge_day_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own challenge day progress" 
ON public.challenge_day_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenge day progress" 
ON public.challenge_day_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenge day progress" 
ON public.challenge_day_progress 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE TRIGGER update_challenge_day_progress_updated_at
BEFORE UPDATE ON public.challenge_day_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_challenge_day_progress_user_challenge 
ON public.challenge_day_progress (user_id, challenge_id);

CREATE INDEX idx_challenge_day_progress_training_day 
ON public.challenge_day_progress (training_day_id);