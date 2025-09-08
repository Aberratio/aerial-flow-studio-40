-- Create admin_complete_challenge_day to safely complete a day for any user (impersonation)
CREATE OR REPLACE FUNCTION public.admin_complete_challenge_day(
  p_user_id uuid,
  p_challenge_id uuid,
  p_day_number integer,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  training_day_record RECORD;
  total_days INTEGER;
  exercise_count INTEGER := 0;
BEGIN
  -- Fetch training day and exercise count
  SELECT ctd.*, COALESCE((SELECT COUNT(*) FROM public.training_day_exercises WHERE training_day_id = ctd.id), 0) AS exercise_count
  INTO training_day_record
  FROM public.challenge_training_days ctd
  WHERE ctd.challenge_id = p_challenge_id AND ctd.day_number = p_day_number;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Training day not found';
  END IF;

  exercise_count := training_day_record.exercise_count;

  -- Ensure participant exists; if not, join the challenge
  IF NOT EXISTS (
    SELECT 1 FROM public.challenge_participants
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id
  ) THEN
    PERFORM public.join_challenge_simple(p_user_id, p_challenge_id);
  END IF;

  -- Update or insert progress for this training day
  UPDATE public.challenge_day_progress
  SET 
    status = 'completed',
    attempt_number = 1,
    exercises_completed = exercise_count,
    total_exercises = exercise_count,
    notes = p_notes,
    changed_status_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id
    AND training_day_id = training_day_record.id;

  IF NOT FOUND THEN
    INSERT INTO public.challenge_day_progress (
      user_id, challenge_id, training_day_id, status, attempt_number, exercises_completed, total_exercises, notes, changed_status_at
    ) VALUES (
      p_user_id, p_challenge_id, training_day_record.id, 'completed', 1, exercise_count, exercise_count, p_notes, now()
    );
  END IF;

  -- Update participant progression
  UPDATE public.challenge_participants
  SET 
    last_completed_day = GREATEST(last_completed_day, p_day_number),
    current_day_number = p_day_number + 1,
    status = 'active',
    updated_at = now()
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

  -- Check if this is the last day and award completion
  SELECT COUNT(*) INTO total_days
  FROM public.challenge_training_days
  WHERE challenge_id = p_challenge_id;

  IF p_day_number = total_days THEN
    PERFORM public.award_challenge_completion_points(p_user_id, p_challenge_id);
  END IF;
END;
$$;

-- Allow authenticated users (clients) to execute this function
GRANT EXECUTE ON FUNCTION public.admin_complete_challenge_day(uuid, uuid, integer, text) TO authenticated;