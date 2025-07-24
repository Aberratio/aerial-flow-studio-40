-- Fix retry days calendar date conflicts
-- This migration updates the handle_challenge_day_status_change function to properly handle retry days
-- by finding the next available date that doesn't conflict with existing calendar days

CREATE OR REPLACE FUNCTION public.handle_challenge_day_status_change(p_user_id uuid, p_challenge_id uuid, p_calendar_date date, p_new_status text, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  retry_calendar_date DATE;
  original_training_day_id UUID;
  original_day_number INTEGER;
  original_title TEXT;
  original_description TEXT;
  original_is_rest_day BOOLEAN;
  original_total_exercises INTEGER;
BEGIN
  -- Update the current day status
  UPDATE public.user_challenge_calendar_days
  SET 
    status = p_new_status,
    notes = COALESCE(p_notes, notes),
    completed_at = CASE WHEN p_new_status IN ('completed', 'rest') THEN now() ELSE NULL END,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date;

  -- If the status is 'failed', create a retry day
  IF p_new_status = 'failed' THEN
    -- Get the original day information
    SELECT training_day_id, day_number, title, description, is_rest_day, total_exercises
    INTO original_training_day_id, original_day_number, original_title, original_description, original_is_rest_day, original_total_exercises
    FROM public.user_challenge_calendar_days
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND calendar_date = p_calendar_date;

    -- Find the next available date that doesn't conflict with existing calendar days
    SELECT COALESCE(
      (SELECT MIN(available_date)
       FROM generate_series(
         p_calendar_date + interval '1 day',
         p_calendar_date + interval '30 days',
         interval '1 day'
       ) AS available_date
       WHERE available_date NOT IN (
         SELECT calendar_date 
         FROM public.user_challenge_calendar_days 
         WHERE user_id = p_user_id 
           AND challenge_id = p_challenge_id
       )
      ), p_calendar_date + interval '1 day'
    ) INTO retry_calendar_date;

    -- Insert the retry day
    INSERT INTO public.user_challenge_calendar_days (
      user_id,
      challenge_id,
      training_day_id,
      calendar_date,
      day_number,
      title,
      description,
      is_rest_day,
      total_exercises,
      status,
      is_retry,
      attempt_number
    ) VALUES (
      p_user_id,
      p_challenge_id,
      original_training_day_id,
      retry_calendar_date,
      original_day_number,
      original_title,
      original_description,
      original_is_rest_day,
      original_total_exercises,
      'pending',
      true,
      COALESCE((
        SELECT MAX(attempt_number) + 1
        FROM public.user_challenge_calendar_days
        WHERE user_id = p_user_id 
          AND challenge_id = p_challenge_id 
          AND training_day_id = original_training_day_id
      ), 2)
    );
  END IF;
END;
$function$;