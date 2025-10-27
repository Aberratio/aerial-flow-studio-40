-- Add missing is_rest_day column to challenge_training_days table
ALTER TABLE public.challenge_training_days 
ADD COLUMN is_rest_day BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.challenge_training_days.is_rest_day IS 
  'Indicates if this day is a rest day (no exercises required)';