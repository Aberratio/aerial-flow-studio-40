-- Drop the old unique constraint that's causing the conflict
ALTER TABLE public.user_challenge_calendar_days 
DROP CONSTRAINT user_challenge_calendar_days_user_id_challenge_id_calendar__key;