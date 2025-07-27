-- Add duration column to challenge_training_days table
ALTER TABLE public.challenge_training_days 
ADD COLUMN duration_seconds integer DEFAULT 0;