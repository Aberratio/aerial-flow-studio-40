-- Create user challenge calendar days view/table for tracking daily progress
CREATE TABLE IF NOT EXISTS public.user_challenge_calendar_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  training_day_id UUID NOT NULL REFERENCES public.challenge_training_days(id) ON DELETE CASCADE,
  calendar_date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'rest', 'skipped')),
  is_retry BOOLEAN DEFAULT false,
  attempt_number INTEGER DEFAULT 1,
  exercises_completed INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, calendar_date)
);

-- Enable RLS
ALTER TABLE public.user_challenge_calendar_days ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own calendar days" 
ON public.user_challenge_calendar_days 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar days" 
ON public.user_challenge_calendar_days 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar days" 
ON public.user_challenge_calendar_days 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar days" 
ON public.user_challenge_calendar_days 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to get user challenge calendar
CREATE OR REPLACE FUNCTION public.get_user_challenge_calendar(
  p_user_id UUID,
  p_challenge_id UUID
)
RETURNS TABLE(
  calendar_date DATE,
  training_day_id UUID,
  day_number INTEGER,
  title TEXT,
  description TEXT,
  is_rest_day BOOLEAN,
  status TEXT,
  is_retry BOOLEAN,
  attempt_number INTEGER,
  exercises_completed INTEGER,
  total_exercises INTEGER,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_today BOOLEAN,
  is_past BOOLEAN,
  is_accessible BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ucd.calendar_date,
    ucd.training_day_id,
    ucd.day_number,
    ucd.title,
    ucd.description,
    ucd.is_rest_day,
    ucd.status,
    ucd.is_retry,
    ucd.attempt_number,
    ucd.exercises_completed,
    ucd.total_exercises,
    ucd.notes,
    ucd.completed_at,
    (ucd.calendar_date = CURRENT_DATE) as is_today,
    (ucd.calendar_date < CURRENT_DATE) as is_past,
    (ucd.calendar_date <= CURRENT_DATE OR ucd.status = 'completed') as is_accessible
  FROM public.user_challenge_calendar_days ucd
  WHERE ucd.user_id = p_user_id 
    AND ucd.challenge_id = p_challenge_id
  ORDER BY ucd.calendar_date;
END;
$function$;

-- Create function to get next available challenge day
CREATE OR REPLACE FUNCTION public.get_next_available_challenge_day(
  p_user_id UUID,
  p_challenge_id UUID
)
RETURNS TABLE(
  calendar_date DATE,
  training_day_id UUID,
  day_number INTEGER,
  is_rest_day BOOLEAN,
  is_retry BOOLEAN,
  attempt_number INTEGER,
  total_exercises INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ucd.calendar_date,
    ucd.training_day_id,
    ucd.day_number,
    ucd.is_rest_day,
    ucd.is_retry,
    ucd.attempt_number,
    ucd.total_exercises
  FROM public.user_challenge_calendar_days ucd
  WHERE ucd.user_id = p_user_id 
    AND ucd.challenge_id = p_challenge_id
    AND ucd.status = 'pending'
    AND ucd.calendar_date <= CURRENT_DATE
  ORDER BY ucd.calendar_date
  LIMIT 1;
END;
$function$;

-- Create function to generate user challenge calendar
CREATE OR REPLACE FUNCTION public.generate_user_challenge_calendar(
  p_user_id UUID,
  p_challenge_id UUID,
  p_start_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  training_day RECORD;
  current_date DATE := p_start_date;
BEGIN
  -- Delete existing calendar for this user/challenge
  DELETE FROM public.user_challenge_calendar_days 
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;

  -- Generate calendar days based on training days
  FOR training_day IN 
    SELECT ctd.*, 
           COALESCE((SELECT COUNT(*) FROM public.training_day_exercises WHERE training_day_id = ctd.id), 0) as exercise_count
    FROM public.challenge_training_days ctd
    WHERE ctd.challenge_id = p_challenge_id
    ORDER BY ctd.day_number
  LOOP
    INSERT INTO public.user_challenge_calendar_days (
      user_id,
      challenge_id,
      training_day_id,
      calendar_date,
      day_number,
      title,
      description,
      is_rest_day,
      total_exercises
    ) VALUES (
      p_user_id,
      p_challenge_id,
      training_day.id,
      current_date,
      training_day.day_number,
      training_day.title,
      training_day.description,
      training_day.is_rest_day,
      training_day.exercise_count
    );
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END;
$function$;

-- Create function to handle challenge day status change
CREATE OR REPLACE FUNCTION public.handle_challenge_day_status_change(
  p_user_id UUID,
  p_challenge_id UUID,
  p_calendar_date DATE,
  p_new_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.user_challenge_calendar_days
  SET 
    status = p_new_status,
    notes = COALESCE(p_notes, notes),
    completed_at = CASE WHEN p_new_status IN ('completed', 'rest') THEN now() ELSE NULL END,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date;
END;
$function$;

-- Create function to check if user can access challenge day
CREATE OR REPLACE FUNCTION public.can_access_challenge_day(
  p_user_id UUID,
  p_challenge_id UUID,
  p_calendar_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  day_accessible BOOLEAN := false;
BEGIN
  SELECT (calendar_date <= CURRENT_DATE OR status = 'completed')
  INTO day_accessible
  FROM public.user_challenge_calendar_days
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date;
    
  RETURN COALESCE(day_accessible, false);
END;
$function$;

-- Create function to reset user challenge progress
CREATE OR REPLACE FUNCTION public.reset_user_challenge_progress(
  p_user_id UUID,
  p_challenge_id UUID,
  p_new_start_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Delete all existing progress
  DELETE FROM public.challenge_day_progress 
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  -- Delete existing calendar
  DELETE FROM public.user_challenge_calendar_days 
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  -- Update participant record
  UPDATE public.challenge_participants 
  SET 
    status = 'active',
    completed = false,
    user_started_at = p_new_start_date::timestamp with time zone,
    joined_at = now()
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  -- Generate new calendar
  PERFORM public.generate_user_challenge_calendar(p_user_id, p_challenge_id, p_new_start_date);
END;
$function$;