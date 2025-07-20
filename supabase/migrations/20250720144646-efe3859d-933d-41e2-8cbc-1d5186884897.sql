-- First, add user_started_at field to challenge_participants
ALTER TABLE public.challenge_participants 
ADD COLUMN user_started_at timestamp with time zone;

-- Add day_number field first without constraint
ALTER TABLE public.challenge_training_days 
ADD COLUMN day_number integer;

-- Update day_number based on existing day_date order
WITH numbered_days AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY challenge_id ORDER BY day_date) as day_num
  FROM public.challenge_training_days
)
UPDATE public.challenge_training_days 
SET day_number = numbered_days.day_num
FROM numbered_days 
WHERE challenge_training_days.id = numbered_days.id;

-- Set default and not null constraint
ALTER TABLE public.challenge_training_days 
ALTER COLUMN day_number SET NOT NULL,
ALTER COLUMN day_number SET DEFAULT 1;

-- Now drop the day_date column
ALTER TABLE public.challenge_training_days 
DROP COLUMN day_date;

-- Add unique constraint
ALTER TABLE public.challenge_training_days 
ADD CONSTRAINT unique_challenge_day_number UNIQUE (challenge_id, day_number);