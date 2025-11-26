-- Remove attempt_number system from challenge_day_progress
-- Users don't have "attempts" - they can start challenges as many times as they want and simply mark as completed

-- Step 1: Delete old records, keeping only the latest one for each (user_id, challenge_id, training_day_id)
-- We'll keep the record with the latest created_at for each combination
DELETE FROM challenge_day_progress
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, challenge_id, training_day_id) id
  FROM challenge_day_progress
  ORDER BY user_id, challenge_id, training_day_id, created_at DESC
);

-- Step 2: Drop the unique constraint that includes attempt_number
ALTER TABLE challenge_day_progress 
DROP CONSTRAINT IF EXISTS challenge_day_progress_user_challenge_day_attempt_unique;

-- Step 3: Add the new unique constraint without attempt_number
ALTER TABLE challenge_day_progress 
ADD CONSTRAINT challenge_day_progress_user_challenge_day_unique 
UNIQUE (user_id, challenge_id, training_day_id);

-- Step 4: Drop old indexes that include attempt_number
DROP INDEX IF EXISTS idx_challenge_day_progress_latest_attempt_v2;
DROP INDEX IF EXISTS idx_challenge_day_progress_latest_attempt;

-- Step 5: Create new index without attempt_number (using created_at for sorting)
CREATE INDEX IF NOT EXISTS idx_challenge_day_progress_user_challenge_day_created 
ON challenge_day_progress (user_id, challenge_id, training_day_id, created_at DESC);

-- Step 6: Update get_latest_attempt_status function to use created_at instead of attempt_number
CREATE OR REPLACE FUNCTION public.get_latest_attempt_status(
  p_user_id uuid,
  p_challenge_id uuid,
  p_training_day_id uuid
)
RETURNS TABLE(
  status text,
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
    cdp.changed_status_at,
    cdp.exercises_completed,
    cdp.total_exercises,
    cdp.notes
  FROM challenge_day_progress cdp
  WHERE cdp.user_id = p_user_id
    AND cdp.challenge_id = p_challenge_id
    AND cdp.training_day_id = p_training_day_id
  ORDER BY cdp.created_at DESC
  LIMIT 1;
END;
$$;

-- Step 7: Update get_next_training_day function to use created_at instead of attempt_number
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
  -- Get the last failed day that needs to be retried (only check the LATEST record for each day)
  WITH latest_records AS (
    SELECT DISTINCT ON (cdp.training_day_id) 
      cdp.training_day_id, 
      cdp.status,
      ctd.day_number,
      cdp.created_at
    FROM challenge_day_progress cdp
    JOIN challenge_training_days ctd ON cdp.training_day_id = ctd.id
    WHERE cdp.user_id = p_user_id 
      AND cdp.challenge_id = p_challenge_id
    ORDER BY cdp.training_day_id, cdp.created_at DESC
  )
  SELECT la.training_day_id, la.day_number
  INTO last_failed_day_record
  FROM latest_records la
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

  -- Get the highest completed day number (only from latest records)
  WITH latest_records AS (
    SELECT DISTINCT ON (cdp.training_day_id) 
      cdp.training_day_id, 
      cdp.status,
      ctd.day_number
    FROM challenge_day_progress cdp
    JOIN challenge_training_days ctd ON cdp.training_day_id = ctd.id
    WHERE cdp.user_id = p_user_id 
      AND cdp.challenge_id = p_challenge_id
    ORDER BY cdp.training_day_id, cdp.created_at DESC
  )
  SELECT COALESCE(MAX(la.day_number), 0)
  INTO last_completed_day
  FROM latest_records la
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

-- Step 8: Drop the get_next_attempt_number function (no longer needed)
DROP FUNCTION IF EXISTS public.get_next_attempt_number(uuid, uuid, uuid);

-- Step 9: Update table comments
COMMENT ON TABLE challenge_day_progress IS 'Stores progress for each training day. Each user can have one record per training day.';
COMMENT ON COLUMN challenge_day_progress.status IS 'Status of the training day: completed, failed, rest, partial, or skipped';

