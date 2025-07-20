-- Add user_started_at field to challenge_participants to track when each user started
ALTER TABLE public.challenge_participants 
ADD COLUMN user_started_at timestamp with time zone;

-- Update challenge_training_days to use relative day numbers instead of fixed dates
ALTER TABLE public.challenge_training_days 
DROP COLUMN day_date,
ADD COLUMN day_number integer NOT NULL DEFAULT 1;

-- Add unique constraint to prevent duplicate day numbers per challenge
ALTER TABLE public.challenge_training_days 
ADD CONSTRAINT unique_challenge_day_number UNIQUE (challenge_id, day_number);