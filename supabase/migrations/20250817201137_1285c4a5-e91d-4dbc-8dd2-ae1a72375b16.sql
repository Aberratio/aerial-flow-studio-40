-- ============================================================
-- FIX SEARCH PATH SECURITY WARNINGS
-- ============================================================

-- Fix all existing functions to have proper search_path set

-- 1. Fix add_points_to_user function
CREATE OR REPLACE FUNCTION public.add_points_to_user(user_id uuid, points integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_scores (user_id, total_points)
  VALUES (user_id, points)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_points = user_scores.total_points + points,
    updated_at = now();
END;
$function$;

-- 2. Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

-- 3. Fix update_user_login_tracking function
CREATE OR REPLACE FUNCTION public.update_user_login_tracking(user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET 
    last_login_at = now(),
    login_count = COALESCE(login_count, 0) + 1,
    updated_at = now()
  WHERE id = user_id;
END;
$function$;

-- 4. Fix friendship_user_pair function
CREATE OR REPLACE FUNCTION public.friendship_user_pair(user1_id uuid, user2_id uuid)
 RETURNS uuid[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
BEGIN
  -- Always return the smaller UUID first to ensure consistent ordering
  IF user1_id < user2_id THEN
    RETURN ARRAY[user1_id, user2_id];
  ELSE
    RETURN ARRAY[user2_id, user1_id];
  END IF;
END;
$function$;

-- 5. Fix create_activity_with_points function
CREATE OR REPLACE FUNCTION public.create_activity_with_points(user_id uuid, activity_type text, activity_data jsonb DEFAULT NULL::jsonb, target_user_id uuid DEFAULT NULL::uuid, points integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Insert activity record
  INSERT INTO public.user_activities (user_id, activity_type, activity_data, target_user_id, points_awarded)
  VALUES (user_id, activity_type, activity_data, target_user_id, points);
  
  -- Add points to user score if points > 0
  IF points > 0 THEN
    PERFORM public.add_points_to_user(user_id, points);
  END IF;
END;
$function$;

-- 6. Fix are_users_friends function
CREATE OR REPLACE FUNCTION public.are_users_friends(user1_id uuid, user2_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND (
      (requester_id = user1_id AND addressee_id = user2_id) OR
      (requester_id = user2_id AND addressee_id = user1_id)
    )
  );
END;
$function$;

-- 7. Fix get_next_training_day function
CREATE OR REPLACE FUNCTION public.get_next_training_day(p_user_id uuid, p_challenge_id uuid)
 RETURNS TABLE(next_day_id uuid, next_day_number integer, is_rest_day boolean, should_retry boolean, last_failed_day_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  last_completed_day integer := 0;
  last_failed_day_record record;
  next_day_record record;
BEGIN
  -- Get the last failed day that needs to be retried (only check the LATEST attempt for each day)
  WITH latest_attempts AS (
    SELECT DISTINCT ON (cdp.training_day_id) 
      cdp.training_day_id, 
      cdp.status,
      ctd.day_number,
      cdp.created_at
    FROM challenge_day_progress cdp
    JOIN challenge_training_days ctd ON cdp.training_day_id = ctd.id
    WHERE cdp.user_id = p_user_id 
      AND cdp.challenge_id = p_challenge_id
    ORDER BY cdp.training_day_id, cdp.attempt_number DESC, cdp.created_at DESC
  )
  SELECT la.training_day_id, la.day_number
  INTO last_failed_day_record
  FROM latest_attempts la
  WHERE la.status = 'failed'
  ORDER BY la.day_number DESC, la.created_at DESC
  LIMIT 1;

  -- If there's a failed day, return it for retry
  IF last_failed_day_record.training_day_id IS NOT NULL THEN
    SELECT ctd.id, ctd.day_number, ctd.is_rest_day
    INTO next_day_id, next_day_number, is_rest_day
    FROM challenge_training_days ctd
    WHERE ctd.id = last_failed_day_record.training_day_id;
    
    should_retry := true;
    last_failed_day_id := last_failed_day_record.training_day_id;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Get the highest completed day number (only from latest attempts)
  WITH latest_attempts AS (
    SELECT DISTINCT ON (cdp.training_day_id) 
      cdp.training_day_id, 
      cdp.status,
      ctd.day_number
    FROM challenge_day_progress cdp
    JOIN challenge_training_days ctd ON cdp.training_day_id = ctd.id
    WHERE cdp.user_id = p_user_id 
      AND cdp.challenge_id = p_challenge_id
    ORDER BY cdp.training_day_id, cdp.attempt_number DESC, cdp.created_at DESC
  )
  SELECT COALESCE(MAX(la.day_number), 0)
  INTO last_completed_day
  FROM latest_attempts la
  WHERE la.status IN ('completed', 'rest');

  -- Get the next training day
  SELECT ctd.id, ctd.day_number, ctd.is_rest_day
  INTO next_day_record
  FROM challenge_training_days ctd
  WHERE ctd.challenge_id = p_challenge_id
    AND ctd.day_number = last_completed_day + 1
  ORDER BY ctd.day_number
  LIMIT 1;

  IF next_day_record.id IS NOT NULL THEN
    next_day_id := next_day_record.id;
    next_day_number := next_day_record.day_number;
    is_rest_day := next_day_record.is_rest_day;
    should_retry := false;
    last_failed_day_id := NULL;
  END IF;

  RETURN NEXT;
END;
$function$;

-- 8. Fix handle_challenge_day_status_change function
CREATE OR REPLACE FUNCTION public.handle_challenge_day_status_change(p_user_id uuid, p_challenge_id uuid, p_calendar_date date, p_new_status text, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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