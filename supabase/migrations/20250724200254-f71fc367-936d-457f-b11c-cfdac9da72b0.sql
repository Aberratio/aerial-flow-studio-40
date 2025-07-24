-- Drop and recreate get_user_challenge_calendar function with id field
DROP FUNCTION IF EXISTS public.get_user_challenge_calendar(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_user_challenge_calendar(p_user_id uuid, p_challenge_id uuid)
 RETURNS TABLE(id uuid, calendar_date date, training_day_id uuid, day_number integer, title text, description text, is_rest_day boolean, status text, is_retry boolean, attempt_number integer, exercises_completed integer, total_exercises integer, notes text, completed_at timestamp with time zone, is_today boolean, is_past boolean, is_accessible boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
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
    (ucd.calendar_date <= CURRENT_DATE OR ucd.status = 'completed') as is_accessible
  FROM public.user_challenge_calendar_days ucd
  WHERE ucd.user_id = p_user_id 
    AND ucd.challenge_id = p_challenge_id
  ORDER BY ucd.calendar_date;
END;
$function$