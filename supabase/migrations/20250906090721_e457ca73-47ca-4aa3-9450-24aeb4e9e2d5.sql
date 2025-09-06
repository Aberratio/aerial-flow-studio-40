-- Update the award_challenge_completion_points function to prevent duplicate rewards
CREATE OR REPLACE FUNCTION public.award_challenge_completion_points(p_user_id uuid, p_challenge_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  challenge_exists boolean;
  participant_exists boolean;
  already_completed boolean;
  points_to_award integer := 50; -- Base points for completing a challenge
BEGIN
  -- Check if challenge exists
  SELECT EXISTS(
    SELECT 1 FROM public.challenges 
    WHERE id = p_challenge_id
  ) INTO challenge_exists;
  
  IF NOT challenge_exists THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;
  
  -- Check if user is a participant
  SELECT EXISTS(
    SELECT 1 FROM public.challenge_participants 
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id
  ) INTO participant_exists;
  
  IF NOT participant_exists THEN
    RAISE EXCEPTION 'User is not a participant in this challenge';
  END IF;
  
  -- Check if user has already completed this challenge before (to prevent duplicate rewards)
  SELECT EXISTS(
    SELECT 1 FROM public.challenge_participants 
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND completed = true
  ) INTO already_completed;
  
  -- Only award points and achievements if this is the first completion
  IF NOT already_completed THEN
    -- Award points and create activity
    PERFORM public.create_activity_with_points(
      p_user_id,
      'challenge_completed',
      jsonb_build_object('challenge_id', p_challenge_id),
      NULL,
      points_to_award
    );
  END IF;
  
  -- Always update participant status to completed (for retakes)
  UPDATE public.challenge_participants
  SET 
    completed = true,
    status = 'completed'
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
END;
$function$;