-- ============================================================
-- FIX REMAINING SEARCH PATH SECURITY WARNINGS
-- ============================================================

-- 9. Fix user_has_challenge_access function
CREATE OR REPLACE FUNCTION public.user_has_challenge_access(p_user_id uuid, p_challenge_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  challenge_premium BOOLEAN;
  user_has_premium BOOLEAN;
  user_purchased BOOLEAN;
BEGIN
  -- Check if challenge is premium
  SELECT premium INTO challenge_premium
  FROM public.challenges
  WHERE id = p_challenge_id;
  
  -- If not premium, access is allowed
  IF NOT challenge_premium THEN
    RETURN true;
  END IF;
  
  -- Check if user has premium subscription
  SELECT role IN ('premium', 'trainer', 'admin') INTO user_has_premium
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- If user has premium subscription, access is allowed
  IF user_has_premium THEN
    RETURN true;
  END IF;
  
  -- Check if user purchased this specific challenge
  SELECT EXISTS(
    SELECT 1 FROM public.user_challenge_purchases
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id
  ) INTO user_purchased;
  
  RETURN user_purchased;
END;
$function$;

-- 10. Fix award_challenge_completion_points function
CREATE OR REPLACE FUNCTION public.award_challenge_completion_points(p_user_id uuid, p_challenge_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  challenge_exists boolean;
  participant_exists boolean;
  points_to_award integer := 50; -- Base points for completing a challenge
BEGIN
  -- Check if challenge exists
  SELECT EXISTS(
    SELECT 1 FROM public.challenges 
    WHERE id = p_challenge_id
  ) INTO challenge_exists;
  
  IF NOT challenge_exists THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;
  
  -- Check if user is a participant
  SELECT EXISTS(
    SELECT 1 FROM public.challenge_participants 
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id
  ) INTO participant_exists;
  
  IF NOT participant_exists THEN
    RAISE EXCEPTION 'User is not a participant in this challenge';
  END IF;
  
  -- Award points and create activity
  PERFORM public.create_activity_with_points(
    p_user_id,
    'challenge_completed',
    jsonb_build_object('challenge_id', p_challenge_id),
    NULL,
    points_to_award
  );
  
  -- Update participant status to completed
  UPDATE public.challenge_participants
  SET 
    completed = true,
    status = 'completed'
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
END;
$function$;

-- 11. Fix get_user_challenge_calendar function
CREATE OR REPLACE FUNCTION public.get_user_challenge_calendar(p_user_id uuid, p_challenge_id uuid)
 RETURNS TABLE(id uuid, calendar_date date, training_day_id uuid, day_number integer, title text, description text, is_rest_day boolean, status text, is_retry boolean, attempt_number integer, exercises_completed integer, total_exercises integer, notes text, completed_at timestamp with time zone, is_today boolean, is_past boolean, is_accessible boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  is_admin BOOLEAN := false;
BEGIN
  -- Check if user is admin
  SELECT (profiles.role = 'admin') INTO is_admin
  FROM public.profiles
  WHERE profiles.id = p_user_id;

  RETURN QUERY
  SELECT 
    ucd.id,
    ucd.calendar_date,
    ucd.training_day_id,
    ucd.day_number,
    ucd.title,
    ucd.description,
    ucd.is_rest_day,
    ucd.status,
    ucd.is_retry,
    ucd.attempt_number,
    ucd.exercises_completed,
    ucd.total_exercises,
    ucd.notes,
    ucd.completed_at,
    (ucd.calendar_date = CURRENT_DATE) as is_today,
    (ucd.calendar_date < CURRENT_DATE) as is_past,
    -- Admin users can access any day, others follow normal rules
    CASE 
      WHEN is_admin THEN true
      ELSE (ucd.calendar_date <= CURRENT_DATE OR ucd.status = 'completed')
    END as is_accessible
  FROM public.user_challenge_calendar_days ucd
  WHERE ucd.user_id = p_user_id 
    AND ucd.challenge_id = p_challenge_id
  ORDER BY ucd.calendar_date;
END;
$function$;

-- 12. Fix get_next_available_challenge_day function
CREATE OR REPLACE FUNCTION public.get_next_available_challenge_day(p_user_id uuid, p_challenge_id uuid)
 RETURNS TABLE(calendar_date date, training_day_id uuid, day_number integer, is_rest_day boolean, is_retry boolean, attempt_number integer, total_exercises integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ucd.calendar_date,
    ucd.training_day_id,
    ucd.day_number,
    ucd.is_rest_day,
    ucd.is_retry,
    ucd.attempt_number,
    ucd.total_exercises
  FROM public.user_challenge_calendar_days ucd
  WHERE ucd.user_id = p_user_id 
    AND ucd.challenge_id = p_challenge_id
    AND ucd.status = 'pending'
    AND ucd.calendar_date <= CURRENT_DATE
  ORDER BY ucd.calendar_date
  LIMIT 1;
END;
$function$;

-- 13. Fix generate_user_challenge_calendar function
CREATE OR REPLACE FUNCTION public.generate_user_challenge_calendar(p_user_id uuid, p_challenge_id uuid, p_start_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  training_day RECORD;
  calendar_day_date DATE := p_start_date;
BEGIN
  -- Delete existing calendar for this user/challenge
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

-- 14. Fix reset_user_challenge_progress function
CREATE OR REPLACE FUNCTION public.reset_user_challenge_progress(p_user_id uuid, p_challenge_id uuid, p_new_start_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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
  
  -- Generate new calendar
  PERFORM public.generate_user_challenge_calendar(p_user_id, p_challenge_id, p_new_start_date);
END;
$function$;

-- 15. Fix can_access_challenge_day function
CREATE OR REPLACE FUNCTION public.can_access_challenge_day(p_user_id uuid, p_challenge_id uuid, p_calendar_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  day_accessible BOOLEAN := false;
  is_admin BOOLEAN := false;
BEGIN
  -- Check if user is admin
  SELECT (role = 'admin') INTO is_admin
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Admin users can access any challenge day
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- For non-admin users, use existing logic
  SELECT (calendar_date <= CURRENT_DATE OR status = 'completed')
  INTO day_accessible
  FROM public.user_challenge_calendar_days
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date;
    
  RETURN COALESCE(day_accessible, false);
END;
$function$;