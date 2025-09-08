-- Drop the complex calendar system
DROP TABLE IF EXISTS public.user_challenge_calendar_days;

-- Update challenge_participants to track current day
ALTER TABLE public.challenge_participants 
ADD COLUMN IF NOT EXISTS current_day_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_completed_day INTEGER DEFAULT 0;

-- Create simple progress tracking table
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, skipped
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  exercises_completed INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, challenge_id, day_number)
);

-- Enable RLS
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_challenge_progress
CREATE POLICY "Users can manage their own challenge progress"
ON public.user_challenge_progress
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Remove rest day logic from challenge_training_days
ALTER TABLE public.challenge_training_days 
DROP COLUMN IF EXISTS is_rest_day;

-- Create function to get available challenge days for user
CREATE OR REPLACE FUNCTION public.get_user_available_challenge_days(p_user_id UUID, p_challenge_id UUID)
RETURNS TABLE(
  day_number INTEGER,
  training_day_id UUID,
  title TEXT,
  description TEXT,
  total_exercises INTEGER,
  status TEXT,
  is_accessible BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_last_completed INTEGER := 0;
  is_admin BOOLEAN := false;
BEGIN
  -- Check if user is admin
  SELECT (role = 'admin') INTO is_admin
  FROM public.profiles
  WHERE id = p_user_id;

  -- Get user's last completed day
  SELECT COALESCE(MAX(day_number), 0) INTO user_last_completed
  FROM public.user_challenge_progress
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND status = 'completed';

  RETURN QUERY
  SELECT 
    ctd.day_number,
    ctd.id as training_day_id,
    ctd.title,
    ctd.description,
    COALESCE((
      SELECT COUNT(*) 
      FROM public.training_day_exercises 
      WHERE training_day_id = ctd.id
    ), 0)::INTEGER as total_exercises,
    COALESCE(ucp.status, 'pending') as status,
    -- Admin can access any day, others can only access current day or completed days
    CASE 
      WHEN is_admin THEN true
      ELSE (ctd.day_number <= user_last_completed + 1)
    END as is_accessible,
    ucp.completed_at
  FROM public.challenge_training_days ctd
  LEFT JOIN public.user_challenge_progress ucp ON (
    ucp.user_id = p_user_id 
    AND ucp.challenge_id = p_challenge_id 
    AND ucp.day_number = ctd.day_number
  )
  WHERE ctd.challenge_id = p_challenge_id
  ORDER BY ctd.day_number;
END;
$$;

-- Function to complete a challenge day
CREATE OR REPLACE FUNCTION public.complete_challenge_day(
  p_user_id UUID,
  p_challenge_id UUID, 
  p_day_number INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  training_day_record RECORD;
  total_days INTEGER;
BEGIN
  -- Get training day info
  SELECT ctd.*, 
         COALESCE((SELECT COUNT(*) FROM public.training_day_exercises WHERE training_day_id = ctd.id), 0) as exercise_count
  INTO training_day_record
  FROM public.challenge_training_days ctd
  WHERE ctd.challenge_id = p_challenge_id AND ctd.day_number = p_day_number;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Training day not found';
  END IF;

  -- Insert or update progress
  INSERT INTO public.user_challenge_progress (
    user_id,
    challenge_id,
    day_number,
    status,
    completed_at,
    notes,
    total_exercises,
    exercises_completed
  ) VALUES (
    p_user_id,
    p_challenge_id,
    p_day_number,
    'completed',
    now(),
    p_notes,
    training_day_record.exercise_count,
    training_day_record.exercise_count
  )
  ON CONFLICT (user_id, challenge_id, day_number)
  DO UPDATE SET
    status = 'completed',
    completed_at = now(),
    notes = p_notes,
    exercises_completed = training_day_record.exercise_count,
    updated_at = now();

  -- Update participant's current day
  UPDATE public.challenge_participants
  SET 
    last_completed_day = GREATEST(last_completed_day, p_day_number),
    current_day_number = p_day_number + 1,
    updated_at = now()
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

  -- Check if challenge is completed
  SELECT COUNT(*) INTO total_days
  FROM public.challenge_training_days
  WHERE challenge_id = p_challenge_id;

  IF p_day_number = total_days THEN
    -- Award completion points and mark as completed
    PERFORM public.award_challenge_completion_points(p_user_id, p_challenge_id);
  END IF;
END;
$$;

-- Function to get next available day for user
CREATE OR REPLACE FUNCTION public.get_next_available_challenge_day(p_user_id UUID, p_challenge_id UUID)
RETURNS TABLE(
  day_number INTEGER,
  training_day_id UUID,
  title TEXT,
  description TEXT,
  total_exercises INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_completed INTEGER := 0;
BEGIN
  -- Get last completed day
  SELECT COALESCE(MAX(day_number), 0) INTO last_completed
  FROM public.user_challenge_progress
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND status = 'completed';

  -- Return next available day
  RETURN QUERY
  SELECT 
    ctd.day_number,
    ctd.id as training_day_id,
    ctd.title,
    ctd.description,
    COALESCE((
      SELECT COUNT(*) 
      FROM public.training_day_exercises 
      WHERE training_day_id = ctd.id
    ), 0)::INTEGER as total_exercises
  FROM public.challenge_training_days ctd
  WHERE ctd.challenge_id = p_challenge_id
    AND ctd.day_number = last_completed + 1
  LIMIT 1;
END;
$$;

-- Function to join challenge (simplified)
CREATE OR REPLACE FUNCTION public.join_challenge_simple(p_user_id UUID, p_challenge_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update participant record
  INSERT INTO public.challenge_participants (
    user_id,
    challenge_id,
    status,
    current_day_number,
    last_completed_day,
    joined_at,
    user_started_at
  ) VALUES (
    p_user_id,
    p_challenge_id,
    'active',
    1,
    0,
    now(),
    now()
  )
  ON CONFLICT (user_id, challenge_id)
  DO UPDATE SET
    status = 'active',
    current_day_number = 1,
    last_completed_day = 0,
    joined_at = now(),
    user_started_at = now();
END;
$$;

-- Drop old complex functions that are no longer needed
DROP FUNCTION IF EXISTS public.generate_user_challenge_calendar(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS public.generate_user_challenge_calendar(UUID, UUID, DATE, BOOLEAN);
DROP FUNCTION IF EXISTS public.get_user_challenge_calendar(UUID, UUID);
DROP FUNCTION IF EXISTS public.handle_challenge_day_status_change(UUID, UUID, DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.can_access_challenge_day(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS public.reset_user_challenge_progress(UUID, UUID, DATE);

-- Update triggers
CREATE OR REPLACE FUNCTION public.update_user_challenge_progress_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_challenge_progress_updated_at
  BEFORE UPDATE ON public.user_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_challenge_progress_updated_at();