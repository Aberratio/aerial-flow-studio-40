-- Update handle_challenge_day_status_change function to create retry day for rest status
DROP FUNCTION IF EXISTS public.handle_challenge_day_status_change(uuid, uuid, date, text, text);

CREATE OR REPLACE FUNCTION public.handle_challenge_day_status_change(p_user_id uuid, p_challenge_id uuid, p_calendar_date date, p_new_status text, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_calendar_day record;
  next_calendar_date date;
  max_attempt integer;
  affected_days_count integer;
BEGIN
  -- Get the current calendar day
  SELECT * INTO current_calendar_day
  FROM public.user_challenge_calendar_days
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Calendar day not found';
  END IF;
  
  -- Update the current day's status
  UPDATE public.user_challenge_calendar_days
  SET 
    status = p_new_status,
    notes = p_notes,
    completed_at = CASE WHEN p_new_status IN ('completed', 'rest') THEN now() ELSE NULL END,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date
    AND id = current_calendar_day.id;
  
  -- If the day was marked as failed OR rest, create a retry day on the next day
  IF p_new_status IN ('failed', 'rest') THEN
    -- Calculate how many days we need to shift (1 for the retry day)
    affected_days_count := 1;
    
    -- Shift all subsequent days by affected_days_count days forward
    UPDATE public.user_challenge_calendar_days
    SET 
      calendar_date = calendar_date + (affected_days_count || ' days')::interval,
      updated_at = now()
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND calendar_date > p_calendar_date;
    
    -- Get the next attempt number for this specific training day
    SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO max_attempt
    FROM public.user_challenge_calendar_days
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND training_day_id = current_calendar_day.training_day_id;
    
    -- Insert the retry day on the next day after the failed/rest day
    -- Use the same day_number but a different attempt_number to avoid constraint violation
    INSERT INTO public.user_challenge_calendar_days (
      user_id,
      challenge_id,
      calendar_date,
      training_day_id,
      day_number,
      title,
      description,
      is_rest_day,
      status,
      is_retry,
      attempt_number,
      total_exercises,
      notes,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_challenge_id,
      p_calendar_date + interval '1 day', -- Next day after failed/rest day
      current_calendar_day.training_day_id,
      current_calendar_day.day_number, -- Same day number
      current_calendar_day.title,
      current_calendar_day.description,
      current_calendar_day.is_rest_day,
      'pending',
      true,
      max_attempt, -- Different attempt number
      current_calendar_day.total_exercises,
      CASE 
        WHEN p_new_status = 'failed' THEN 'Retry attempt for failed day'
        WHEN p_new_status = 'rest' THEN 'Retry attempt for rest day'
        ELSE 'Retry attempt'
      END,
      now(),
      now()
    );
  END IF;
END;
$function$;