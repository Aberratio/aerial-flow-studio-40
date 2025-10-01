-- One-time fix: Update challenge_participants for users who have completed all challenge days
-- This function will mark challenges as completed for users who have finished all days

CREATE OR REPLACE FUNCTION fix_completed_challenges()
RETURNS TABLE(user_id uuid, challenge_id uuid, total_days bigint, completed_days bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update challenge_participants to completed=true for users who finished all days
  UPDATE challenge_participants cp
  SET 
    completed = true,
    status = 'completed',
    updated_at = now()
  FROM (
    SELECT 
      cdp.user_id,
      cdp.challenge_id,
      COUNT(DISTINCT ctd.id) as total_days,
      COUNT(DISTINCT cdp.training_day_id) as completed_days
    FROM challenge_day_progress cdp
    JOIN challenge_training_days ctd ON ctd.challenge_id = cdp.challenge_id
    WHERE cdp.status = 'completed'
    GROUP BY cdp.user_id, cdp.challenge_id
    HAVING COUNT(DISTINCT cdp.training_day_id) >= COUNT(DISTINCT ctd.id)
  ) completed_challenges
  WHERE cp.user_id = completed_challenges.user_id
    AND cp.challenge_id = completed_challenges.challenge_id
    AND cp.completed = false;

  -- Return the updated records for verification
  RETURN QUERY
  SELECT 
    cdp.user_id,
    cdp.challenge_id,
    COUNT(DISTINCT ctd.id) as total_days,
    COUNT(DISTINCT cdp.training_day_id) as completed_days
  FROM challenge_day_progress cdp
  JOIN challenge_training_days ctd ON ctd.challenge_id = cdp.challenge_id
  WHERE cdp.status = 'completed'
  GROUP BY cdp.user_id, cdp.challenge_id
  HAVING COUNT(DISTINCT cdp.training_day_id) >= COUNT(DISTINCT ctd.id);
END;
$$;

-- Run the fix function
SELECT * FROM fix_completed_challenges();