-- Fix ambiguous column reference in get_user_available_challenge_days function
CREATE OR REPLACE FUNCTION public.get_user_available_challenge_days(p_user_id uuid, p_challenge_id uuid)
RETURNS TABLE(day_number integer, training_day_id uuid, title text, description text, total_exercises integer, status text, is_accessible boolean, completed_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_last_completed INTEGER := 0;
  is_admin BOOLEAN := false;
BEGIN
  -- Check if user is admin
  SELECT (role = 'admin') INTO is_admin
  FROM public.profiles
  WHERE id = p_user_id;

  -- Get user's last completed day
  SELECT COALESCE(MAX(ctd.day_number), 0) INTO user_last_completed
  FROM public.user_challenge_progress ucp
  JOIN public.challenge_training_days ctd ON ctd.id = ucp.training_day_id
  WHERE ucp.user_id = p_user_id 
    AND ucp.challenge_id = p_challenge_id 
    AND ucp.status = 'completed';

  RETURN QUERY
  SELECT 
    ctd.day_number,
    ctd.id as training_day_id,
    ctd.title,
    ctd.description,
    COALESCE((
      SELECT COUNT(*) 
      FROM public.training_day_exercises tde
      WHERE tde.training_day_id = ctd.id
    ), 0)::INTEGER as total_exercises,
    COALESCE(cdp.status, 'pending') as status,
    -- Admin can access any day, others can only access current day or completed days
    CASE 
      WHEN is_admin THEN true
      ELSE (ctd.day_number <= user_last_completed + 1)
    END as is_accessible,
    cdp.changed_status_at as completed_at
  FROM public.challenge_training_days ctd
  LEFT JOIN public.challenge_day_progress cdp ON (
    cdp.user_id = p_user_id 
    AND cdp.challenge_id = p_challenge_id 
    AND cdp.training_day_id = ctd.id
  )
  WHERE ctd.challenge_id = p_challenge_id
  ORDER BY ctd.day_number;
END;
$function$;