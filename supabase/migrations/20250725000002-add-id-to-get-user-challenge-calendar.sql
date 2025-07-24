-- Add id field to get_user_challenge_calendar function return value
CREATE OR REPLACE FUNCTION public.get_user_challenge_calendar(
  p_user_id UUID,
  p_challenge_id UUID
)
RETURNS TABLE(
  id UUID,
  calendar_date DATE,
  training_day_id UUID,
  day_number INTEGER,
  title TEXT,
  description TEXT,
  is_rest_day BOOLEAN,
  status TEXT,
  is_retry BOOLEAN,
  attempt_number INTEGER,
  exercises_completed INTEGER,
  total_exercises INTEGER,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_today BOOLEAN,
  is_past BOOLEAN,
  is_accessible BOOLEAN
)
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
$function$; 