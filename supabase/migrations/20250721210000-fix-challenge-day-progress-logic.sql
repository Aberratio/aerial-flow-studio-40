-- Fix challenge day progress logic and improve handling of multiple attempts

-- First, let's ensure we have proper indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenge_day_progress_latest_attempt_v2 
ON challenge_day_progress (user_id, challenge_id, training_day_id, attempt_number DESC, created_at DESC);

-- Create a function to get the latest attempt status for a specific training day
CREATE OR REPLACE FUNCTION public.get_latest_attempt_status(
  p_user_id uuid,
  p_challenge_id uuid,
  p_training_day_id uuid
)
RETURNS TABLE(
  status text,
  attempt_number integer,
  changed_status_at timestamp with time zone,
  exercises_completed integer,
  total_exercises integer,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cdp.status,
    cdp.attempt_number,
    cdp.changed_status_at,
    cdp.exercises_completed,
    cdp.total_exercises,
    cdp.notes
  FROM challenge_day_progress cdp
  WHERE cdp.user_id = p_user_id
    AND cdp.challenge_id = p_challenge_id
    AND cdp.training_day_id = p_training_day_id
  ORDER BY cdp.attempt_number DESC, cdp.created_at DESC
  LIMIT 1;
END;
$$;

-- Update the get_next_training_day function to be more robust
CREATE OR REPLACE FUNCTION public.get_next_training_day(p_user_id uuid, p_challenge_id uuid)
RETURNS TABLE(
  next_day_id uuid, 
  next_day_number integer, 
  is_rest_day boolean, 
  should_retry boolean, 
  last_failed_day_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create a function to get the next attempt number for a training day
CREATE OR REPLACE FUNCTION public.get_next_attempt_number(
  p_user_id uuid,
  p_challenge_id uuid,
  p_training_day_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_attempt integer;
BEGIN
  SELECT COALESCE(MAX(attempt_number), 0)
  INTO max_attempt
  FROM challenge_day_progress
  WHERE user_id = p_user_id
    AND challenge_id = p_challenge_id
    AND training_day_id = p_training_day_id;
  
  RETURN max_attempt + 1;
END;
$$;

-- Add a comment to clarify the table structure
COMMENT ON TABLE challenge_day_progress IS 'Stores individual attempts for each training day. Each row represents one attempt, with attempt_number incrementing for retries.';
COMMENT ON COLUMN challenge_day_progress.attempt_number IS 'Incremental number for each attempt at this training day. 1 = first attempt, 2 = retry, etc.';
COMMENT ON COLUMN challenge_day_progress.status IS 'Status of this specific attempt: completed, failed, rest, partial, or skipped'; 