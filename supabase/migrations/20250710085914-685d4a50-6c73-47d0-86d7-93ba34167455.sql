-- Add difficulty_level to challenges table
ALTER TABLE public.challenges 
ADD COLUMN difficulty_level TEXT DEFAULT 'intermediate';

-- Add is_rest_day to challenge_training_days table
ALTER TABLE public.challenge_training_days 
ADD COLUMN is_rest_day BOOLEAN DEFAULT false;