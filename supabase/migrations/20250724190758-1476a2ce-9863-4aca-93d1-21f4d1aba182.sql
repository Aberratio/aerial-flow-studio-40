-- Drop the existing unique constraint on user_challenge_calendar_days
ALTER TABLE public.user_challenge_calendar_days 
DROP CONSTRAINT IF EXISTS user_challenge_calendar_days_user_id_challenge_id_calendar_date_key;

-- Add the new unique constraint including day_number
ALTER TABLE public.user_challenge_calendar_days 
ADD CONSTRAINT user_challenge_calendar_days_user_id_challenge_id_calendar_date_day_number_key 
UNIQUE (user_id, challenge_id, calendar_date, day_number);