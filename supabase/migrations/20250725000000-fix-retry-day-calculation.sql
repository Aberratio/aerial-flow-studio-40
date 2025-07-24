-- Fix retry day calculation logic in handle_challenge_day_status_change function
CREATE OR REPLACE FUNCTION public.handle_challenge_day_status_change(
  p_user_id uuid,
  p_challenge_id uuid,
  p_calendar_date date,
  p_new_status text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_calendar_day record;
  next_calendar_date date;
  retry_calendar_date date;
  max_attempt integer;
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
    AND calendar_date = p_calendar_date;
  
  -- If the day was marked as failed, create a retry day
  IF p_new_status = 'failed' THEN
    -- Find the next available calendar date for the retry
    -- Start from the day after the failed day and find the first available date
    SELECT COALESCE(
      (SELECT MIN(available_date)
       FROM generate_series(
         p_calendar_date + interval '1 day',
         p_calendar_date + interval '30 days', -- Look ahead up to 30 days
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
    
    -- Get the next attempt number
    SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO max_attempt
    FROM public.user_challenge_calendar_days
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND training_day_id = current_calendar_day.training_day_id;
    
    -- Insert the retry day
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
      retry_calendar_date,
      current_calendar_day.training_day_id,
      current_calendar_day.day_number,
      current_calendar_day.title,
      current_calendar_day.description,
      current_calendar_day.is_rest_day,
      'pending',
      true,
      max_attempt,
      current_calendar_day.total_exercises,
      'Retry attempt for failed day',
      now(),
      now()
    );
  END IF;
  
  -- If the day was marked as rest, we need to shift the next training day
  IF p_new_status = 'rest' THEN
    -- Find the next pending day that's not a rest day
    SELECT calendar_date INTO next_calendar_date
    FROM public.user_challenge_calendar_days
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND calendar_date > p_calendar_date
      AND status = 'pending'
      AND is_retry = false
    ORDER BY calendar_date
    LIMIT 1;
    
    -- If we found a next day, we need to shift it to the day after the rest day
    IF next_calendar_date IS NOT NULL THEN
      -- Update the next day's calendar date to be the day after the rest day
      UPDATE public.user_challenge_calendar_days
      SET 
        calendar_date = p_calendar_date + interval '1 day',
        updated_at = now()
      WHERE user_id = p_user_id 
        AND challenge_id = p_challenge_id 
        AND calendar_date = next_calendar_date;
    END IF;
  END IF;
END;
$$; 