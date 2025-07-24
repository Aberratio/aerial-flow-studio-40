-- Update the join challenge flow to use the new calendar generation system
-- This migration adds a function to handle the complete join challenge process

-- Create a function to handle the complete join challenge process
CREATE OR REPLACE FUNCTION public.join_challenge_with_calendar(
  p_user_id uuid,
  p_challenge_id uuid,
  p_start_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, insert or update the participant record
  INSERT INTO public.challenge_participants (
    user_id,
    challenge_id,
    status,
    user_started_at,
    joined_at
  ) VALUES (
    p_user_id,
    p_challenge_id,
    'active',
    p_start_date,
    now()
  )
  ON CONFLICT (user_id, challenge_id)
  DO UPDATE SET
    status = 'active',
    user_started_at = p_start_date,
    joined_at = now();

  -- Then generate the calendar for this user
  PERFORM public.generate_user_challenge_calendar(p_user_id, p_challenge_id, p_start_date);
END;
$$;

-- Create a function to check if a user can join a challenge
CREATE OR REPLACE FUNCTION public.can_join_challenge(
  p_user_id uuid,
  p_challenge_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenge_record record;
  participant_record record;
BEGIN
  -- Check if challenge exists and is published
  SELECT * INTO challenge_record
  FROM public.challenges
  WHERE id = p_challenge_id AND status = 'published';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user is already a participant
  SELECT * INTO participant_record
  FROM public.challenge_participants
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  IF FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if challenge is within the valid date range
  IF now() < challenge_record.start_date OR now() > challenge_record.end_date THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Create a function to get challenge participation status
CREATE OR REPLACE FUNCTION public.get_challenge_participation_status(
  p_user_id uuid,
  p_challenge_id uuid
)
RETURNS TABLE(
  is_participant boolean,
  status text,
  user_started_at timestamp with time zone,
  joined_at timestamp with time zone,
  completed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as is_participant,
    cp.status,
    cp.user_started_at,
    cp.joined_at,
    cp.completed
  FROM public.challenge_participants cp
  WHERE cp.user_id = p_user_id AND cp.challenge_id = p_challenge_id
  UNION ALL
  SELECT 
    false as is_participant,
    'not_joined'::text as status,
    NULL::timestamp with time zone as user_started_at,
    NULL::timestamp with time zone as joined_at,
    false as completed
  WHERE NOT EXISTS (
    SELECT 1 FROM public.challenge_participants 
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id
  );
END;
$$;

-- Add comments to explain the new functions
COMMENT ON FUNCTION public.join_challenge_with_calendar IS 'Handles the complete process of joining a challenge, including participant record creation and calendar generation';
COMMENT ON FUNCTION public.can_join_challenge IS 'Checks if a user can join a specific challenge based on various criteria';
COMMENT ON FUNCTION public.get_challenge_participation_status IS 'Returns the participation status of a user for a specific challenge'; 