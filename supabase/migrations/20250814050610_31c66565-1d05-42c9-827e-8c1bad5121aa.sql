-- Update the can_access_challenge_day function to allow admin users to access any day
CREATE OR REPLACE FUNCTION public.can_access_challenge_day(p_user_id uuid, p_challenge_id uuid, p_calendar_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
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
$function$