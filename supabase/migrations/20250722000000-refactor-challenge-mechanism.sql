-- Complete refactor of the challenge mechanism
-- This migration introduces a new approach where each calendar day is a separate entity
-- This makes the system much more intuitive and easier to maintain

-- First, create a new table for user challenge calendars
-- This will store the actual calendar days for each user's challenge participation
CREATE TABLE public.user_challenge_calendar_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  calendar_date DATE NOT NULL, -- The actual calendar date
  training_day_id UUID NOT NULL REFERENCES public.challenge_training_days(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- The original training day number
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'rest', 'skipped')),
  is_retry BOOLEAN NOT NULL DEFAULT false, -- Whether this is a retry of a failed day
  attempt_number INTEGER NOT NULL DEFAULT 1, -- Which attempt this is (1 = original, 2+ = retries)
  exercises_completed INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique calendar day per user per challenge
  UNIQUE(user_id, challenge_id, calendar_date),
  
  -- Ensure we don't have duplicate attempts for the same training day on the same calendar date
  UNIQUE(user_id, challenge_id, training_day_id, calendar_date)
);

-- Create indexes for better performance
CREATE INDEX idx_user_challenge_calendar_days_user_challenge 
ON public.user_challenge_calendar_days (user_id, challenge_id);

CREATE INDEX idx_user_challenge_calendar_days_calendar_date 
ON public.user_challenge_calendar_days (calendar_date);

CREATE INDEX idx_user_challenge_calendar_days_status 
ON public.user_challenge_calendar_days (status);

CREATE INDEX idx_user_challenge_calendar_days_training_day 
ON public.user_challenge_calendar_days (training_day_id);

-- Enable Row Level Security
ALTER TABLE public.user_challenge_calendar_days ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create trigger for updated_at
CREATE TRIGGER update_user_challenge_calendar_days_updated_at
BEFORE UPDATE ON public.user_challenge_calendar_days
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to generate the initial calendar for a user when they join a challenge
CREATE OR REPLACE FUNCTION public.generate_user_challenge_calendar(
  p_user_id uuid,
  p_challenge_id uuid,
  p_start_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  training_day_record record;
  current_calendar_date date;
  day_offset integer := 0;
BEGIN
  -- Delete any existing calendar days for this user and challenge
  DELETE FROM public.user_challenge_calendar_days 
  WHERE user_id = p_user_id AND challenge_id = p_challenge_id;
  
  -- Generate calendar days starting from the user's start date
  current_calendar_date := p_start_date;
  
  -- Loop through all training days for this challenge
  FOR training_day_record IN 
    SELECT id, day_number, is_rest_day
    FROM public.challenge_training_days 
    WHERE challenge_id = p_challenge_id 
    ORDER BY day_number
  LOOP
    -- Insert the calendar day
    INSERT INTO public.user_challenge_calendar_days (
      user_id,
      challenge_id,
      calendar_date,
      training_day_id,
      day_number,
      status,
      is_retry,
      attempt_number,
      total_exercises,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_challenge_id,
      current_calendar_date,
      training_day_record.id,
      training_day_record.day_number,
      'pending',
      false,
      1,
      CASE 
        WHEN training_day_record.is_rest_day THEN 0
        ELSE (
          SELECT COUNT(*) 
          FROM public.training_day_exercises 
          WHERE training_day_id = training_day_record.id
        )
      END,
      now(),
      now()
    );
    
    -- Move to next calendar date
    current_calendar_date := current_calendar_date + interval '1 day';
  END LOOP;
END;
$$;

-- Create a function to handle day status changes and manage retries
CREATE OR REPLACE FUNCTION public.handle_challenge_day_status_change(
  p_user_id uuid,
  p_challenge_id uuid,
  p_calendar_date date,
  p_new_status text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_calendar_day record;
  next_calendar_date date;
  retry_calendar_date date;
  max_attempt integer;
BEGIN
  -- Get the current calendar day
  SELECT * INTO current_calendar_day
  FROM public.user_challenge_calendar_days
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Calendar day not found';
  END IF;
  
  -- Update the current day's status
  UPDATE public.user_challenge_calendar_days
  SET 
    status = p_new_status,
    notes = p_notes,
    completed_at = CASE WHEN p_new_status IN ('completed', 'rest') THEN now() ELSE NULL END,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date;
  
  -- If the day was marked as failed, create a retry day
  IF p_new_status = 'failed' THEN
    -- Find the next available calendar date for the retry
    SELECT calendar_date + interval '1 day' INTO retry_calendar_date
    FROM public.user_challenge_calendar_days
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND calendar_date = p_calendar_date;
    
    -- Get the next attempt number
    SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO max_attempt
    FROM public.user_challenge_calendar_days
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND training_day_id = current_calendar_day.training_day_id;
    
    -- Insert the retry day
    INSERT INTO public.user_challenge_calendar_days (
      user_id,
      challenge_id,
      calendar_date,
      training_day_id,
      day_number,
      status,
      is_retry,
      attempt_number,
      total_exercises,
      notes,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_challenge_id,
      retry_calendar_date,
      current_calendar_day.training_day_id,
      current_calendar_day.day_number,
      'pending',
      true,
      max_attempt,
      current_calendar_day.total_exercises,
      'Retry attempt for failed day',
      now(),
      now()
    );
  END IF;
  
  -- If the day was marked as rest, we need to shift the next training day
  IF p_new_status = 'rest' THEN
    -- Find the next pending day that's not a rest day
    SELECT calendar_date INTO next_calendar_date
    FROM public.user_challenge_calendar_days
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND calendar_date > p_calendar_date
      AND status = 'pending'
      AND is_retry = false
    ORDER BY calendar_date
    LIMIT 1;
    
    -- If we found a next day, we need to shift it to the day after the rest day
    IF next_calendar_date IS NOT NULL THEN
      -- Update the next day's calendar date to be the day after the rest day
      UPDATE public.user_challenge_calendar_days
      SET 
        calendar_date = p_calendar_date + interval '1 day',
        updated_at = now()
      WHERE user_id = p_user_id 
        AND challenge_id = p_challenge_id 
        AND calendar_date = next_calendar_date;
    END IF;
  END IF;
END;
$$;

-- Create a function to get the next available day for a user
CREATE OR REPLACE FUNCTION public.get_next_available_challenge_day(
  p_user_id uuid,
  p_challenge_id uuid
)
RETURNS TABLE(
  calendar_date date,
  training_day_id uuid,
  day_number integer,
  is_rest_day boolean,
  is_retry boolean,
  attempt_number integer,
  total_exercises integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uccd.calendar_date,
    uccd.training_day_id,
    uccd.day_number,
    ctd.is_rest_day,
    uccd.is_retry,
    uccd.attempt_number,
    uccd.total_exercises
  FROM public.user_challenge_calendar_days uccd
  JOIN public.challenge_training_days ctd ON uccd.training_day_id = ctd.id
  WHERE uccd.user_id = p_user_id 
    AND uccd.challenge_id = p_challenge_id 
    AND uccd.status = 'pending'
    AND uccd.calendar_date <= current_date -- Only show days up to today
  ORDER BY uccd.calendar_date
  LIMIT 1;
END;
$$;

-- Create a function to get all calendar days for a user's challenge
CREATE OR REPLACE FUNCTION public.get_user_challenge_calendar(
  p_user_id uuid,
  p_challenge_id uuid
)
RETURNS TABLE(
  calendar_date date,
  training_day_id uuid,
  day_number integer,
  title text,
  description text,
  is_rest_day boolean,
  status text,
  is_retry boolean,
  attempt_number integer,
  exercises_completed integer,
  total_exercises integer,
  notes text,
  completed_at timestamp with time zone,
  is_today boolean,
  is_past boolean,
  is_accessible boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uccd.calendar_date,
    uccd.training_day_id,
    uccd.day_number,
    ctd.title,
    ctd.description,
    ctd.is_rest_day,
    uccd.status,
    uccd.is_retry,
    uccd.attempt_number,
    uccd.exercises_completed,
    uccd.total_exercises,
    uccd.notes,
    uccd.completed_at,
    (uccd.calendar_date = current_date) as is_today,
    (uccd.calendar_date < current_date) as is_past,
    CASE 
      -- First day is always accessible
      WHEN uccd.day_number = 1 THEN true
      -- Completed days are accessible
      WHEN uccd.status IN ('completed', 'rest') THEN true
      -- Failed days are accessible for retry
      WHEN uccd.status = 'failed' THEN true
      -- Retry days are accessible
      WHEN uccd.is_retry THEN true
      -- Check if previous day is completed
      ELSE EXISTS (
        SELECT 1 
        FROM public.user_challenge_calendar_days prev_day
        WHERE prev_day.user_id = p_user_id 
          AND prev_day.challenge_id = p_challenge_id
          AND prev_day.day_number = uccd.day_number - 1
          AND prev_day.status IN ('completed', 'rest')
      )
    END as is_accessible
  FROM public.user_challenge_calendar_days uccd
  JOIN public.challenge_training_days ctd ON uccd.training_day_id = ctd.id
  WHERE uccd.user_id = p_user_id 
    AND uccd.challenge_id = p_challenge_id
  ORDER BY uccd.calendar_date;
END;
$$;

-- Create a function to check if a user can access a specific calendar day
CREATE OR REPLACE FUNCTION public.can_access_challenge_day(
  p_user_id uuid,
  p_challenge_id uuid,
  p_calendar_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  day_record record;
BEGIN
  -- Get the calendar day
  SELECT * INTO day_record
  FROM public.user_challenge_calendar_days
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND calendar_date = p_calendar_date;
    
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- First day is always accessible
  IF day_record.day_number = 1 THEN
    RETURN true;
  END IF;
  
  -- Completed days are accessible
  IF day_record.status IN ('completed', 'rest') THEN
    RETURN true;
  END IF;
  
  -- Failed days are accessible for retry
  IF day_record.status = 'failed' THEN
    RETURN true;
  END IF;
  
  -- Retry days are accessible
  IF day_record.is_retry THEN
    RETURN true;
  END IF;
  
  -- Check if previous day is completed
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_challenge_calendar_days prev_day
    WHERE prev_day.user_id = p_user_id 
      AND prev_day.challenge_id = p_challenge_id
      AND prev_day.day_number = day_record.day_number - 1
      AND prev_day.status IN ('completed', 'rest')
  );
END;
$$;

-- Add comments to explain the new structure
COMMENT ON TABLE user_challenge_calendar_days IS 'Stores the actual calendar days for each user''s challenge participation. Each row represents one calendar day with its associated training day and status.';
COMMENT ON COLUMN user_challenge_calendar_days.calendar_date IS 'The actual calendar date for this training day';
COMMENT ON COLUMN user_challenge_calendar_days.is_retry IS 'Whether this is a retry of a previously failed day';
COMMENT ON COLUMN user_challenge_calendar_days.attempt_number IS 'Which attempt this is (1 = original, 2+ = retries)';
COMMENT ON COLUMN user_challenge_calendar_days.status IS 'Current status: pending, completed, failed, rest, or skipped'; 