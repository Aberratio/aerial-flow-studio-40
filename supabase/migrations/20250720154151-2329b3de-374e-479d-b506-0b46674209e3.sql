-- Add new columns to challenge_day_progress to support rest days and failed attempts
ALTER TABLE public.challenge_day_progress 
ADD COLUMN status text NOT NULL DEFAULT 'completed',
ADD COLUMN scheduled_date timestamp with time zone,
ADD COLUMN attempt_number integer NOT NULL DEFAULT 1;

-- Create index for better performance
CREATE INDEX idx_challenge_day_progress_status ON public.challenge_day_progress(status);
CREATE INDEX idx_challenge_day_progress_scheduled_date ON public.challenge_day_progress(scheduled_date);

-- Update existing records to have proper status
UPDATE public.challenge_day_progress 
SET status = 'completed' 
WHERE exercises_completed = total_exercises AND total_exercises > 0;

UPDATE public.challenge_day_progress 
SET status = 'partial' 
WHERE exercises_completed < total_exercises AND exercises_completed > 0;

-- Add constraint for valid status values
ALTER TABLE public.challenge_day_progress 
ADD CONSTRAINT check_status_valid 
CHECK (status IN ('completed', 'failed', 'rest', 'partial', 'skipped'));

-- Create a function to get the next training day for a user
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
  -- Get the last failed day that needs to be retried
  SELECT cdp.training_day_id, ctd.day_number
  INTO last_failed_day_record
  FROM challenge_day_progress cdp
  JOIN challenge_training_days ctd ON cdp.training_day_id = ctd.id
  WHERE cdp.user_id = p_user_id 
    AND cdp.challenge_id = p_challenge_id
    AND cdp.status = 'failed'
  ORDER BY ctd.day_number DESC, cdp.created_at DESC
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

  -- Get the highest completed day number
  SELECT COALESCE(MAX(ctd.day_number), 0)
  INTO last_completed_day
  FROM challenge_day_progress cdp
  JOIN challenge_training_days ctd ON cdp.training_day_id = ctd.id
  WHERE cdp.user_id = p_user_id 
    AND cdp.challenge_id = p_challenge_id
    AND cdp.status IN ('completed', 'rest');

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