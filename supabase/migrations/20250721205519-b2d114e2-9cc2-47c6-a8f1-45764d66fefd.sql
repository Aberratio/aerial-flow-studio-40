-- First, let's ensure we have proper indexes and constraints for handling multiple attempts
-- Add a unique constraint to prevent duplicate attempts with same attempt_number for same user/day combo
-- But first, let's add a unique index that allows multiple attempts

-- Add index for better performance when querying latest attempts
CREATE INDEX IF NOT EXISTS idx_challenge_day_progress_latest_attempt 
ON challenge_day_progress (user_id, challenge_id, training_day_id, attempt_number DESC, created_at DESC);

-- Add index for user progress queries
CREATE INDEX IF NOT EXISTS idx_challenge_day_progress_user_challenge 
ON challenge_day_progress (user_id, challenge_id, status, created_at DESC);

-- Update the get_next_training_day function to better handle multiple attempts
CREATE OR REPLACE FUNCTION public.get_next_training_day(p_user_id uuid, p_challenge_id uuid)
RETURNS TABLE(next_day_id uuid, next_day_number integer, is_rest_day boolean, should_retry boolean, last_failed_day_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
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