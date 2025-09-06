-- 1. Add unique constraint to prevent duplicate challenge participations
ALTER TABLE public.challenge_participants 
ADD CONSTRAINT unique_user_challenge_participation 
UNIQUE (user_id, challenge_id);

-- 2. Make generate_user_challenge_calendar idempotent to prevent accidental resets
CREATE OR REPLACE FUNCTION public.generate_user_challenge_calendar(p_user_id uuid, p_challenge_id uuid, p_start_date date, p_force boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  training_day RECORD;
  calendar_day_date DATE := p_start_date;
  existing_days_count INTEGER;
BEGIN
  -- Check if calendar already exists (unless forced)
  IF NOT p_force THEN
    SELECT COUNT(*) INTO existing_days_count
    FROM public.user_challenge_calendar_days 
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
    
    -- If calendar already exists, do nothing
    IF existing_days_count > 0 THEN
      RETURN;
    END IF;
  END IF;

  -- Delete existing calendar for this user/challenge (only when forced or no existing data)
  DELETE FROM public.user_challenge_calendar_days 
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

  -- Generate calendar days based on training days
  FOR training_day IN 
    SELECT ctd.*, 
           COALESCE((SELECT COUNT(*) FROM public.training_day_exercises WHERE training_day_id = ctd.id), 0) as exercise_count
    FROM public.challenge_training_days ctd
    WHERE ctd.challenge_id = p_challenge_id
    ORDER BY ctd.day_number
  LOOP
    INSERT INTO public.user_challenge_calendar_days (
      user_id,
      challenge_id,
      training_day_id,
      calendar_date,
      day_number,
      title,
      description,
      is_rest_day,
      total_exercises
    ) VALUES (
      p_user_id,
      p_challenge_id,
      training_day.id,
      calendar_day_date,
      training_day.day_number,
      training_day.title,
      training_day.description,
      training_day.is_rest_day,
      training_day.exercise_count
    );
    
    calendar_day_date := calendar_day_date + INTERVAL '1 day';
  END LOOP;
END;
$function$;

-- 3. Update reset function to use the new force parameter
CREATE OR REPLACE FUNCTION public.reset_user_challenge_progress(p_user_id uuid, p_challenge_id uuid, p_new_start_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete all existing progress
  DELETE FROM public.challenge_day_progress 
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  -- Delete existing calendar
  DELETE FROM public.user_challenge_calendar_days 
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  -- Update participant record
  UPDATE public.challenge_participants 
  SET 
    status = 'active',
    completed = false,
    user_started_at = p_new_start_date::timestamp with time zone,
    joined_at = now()
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  -- Generate new calendar with force=true
  PERFORM public.generate_user_challenge_calendar(p_user_id, p_challenge_id, p_new_start_date, true);
END;
$function$;

-- 4. Add locking to handle_challenge_day_status_change to prevent race conditions
CREATE OR REPLACE FUNCTION public.handle_challenge_day_status_change(p_user_id uuid, p_challenge_id uuid, p_calendar_date date, p_new_status text, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_calendar_day record;
  next_calendar_date date;
  max_attempt integer;
  affected_days_count integer;
BEGIN
  -- Get the current calendar day with row-level lock to prevent race conditions
  SELECT * INTO current_calendar_day
  FROM public.user_challenge_calendar_days
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date
  FOR UPDATE;
    
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
    -- Check if a retry day already exists to prevent duplicates
    IF NOT EXISTS (
      SELECT 1 FROM public.user_challenge_calendar_days
      WHERE user_id = p_user_id 
        AND challenge_id = p_challenge_id 
        AND training_day_id = current_calendar_day.training_day_id
        AND is_retry = true
        AND status = 'pending'
    ) THEN
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
        p_calendar_date + interval '1 day',
        current_calendar_day.training_day_id,
        current_calendar_day.day_number,
        current_calendar_day.title,
        current_calendar_day.description,
        current_calendar_day.is_rest_day,
        'pending',
        true,
        max_attempt,
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
  END IF;
END;
$function$;