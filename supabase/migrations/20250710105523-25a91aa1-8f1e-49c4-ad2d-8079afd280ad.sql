-- Create user_scores table to track total points per user
CREATE TABLE public.user_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_activities table to track individual activities for inbox
CREATE TABLE public.user_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'post', 'challenge_complete', etc.
  activity_data JSONB, -- flexible data storage for activity details
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- who performed the action on this user's content
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_scores
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_scores
CREATE POLICY "Users can view all scores" 
ON public.user_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own score" 
ON public.user_scores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert scores" 
ON public.user_scores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Enable RLS on user_activities
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_activities
CREATE POLICY "Users can view their own activities" 
ON public.user_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create activities" 
ON public.user_activities 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_user_scores_user_id ON public.user_scores(user_id);
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX idx_user_activities_type ON public.user_activities(activity_type);

-- Create trigger for automatic timestamp updates on user_scores
CREATE TRIGGER update_user_scores_updated_at
BEFORE UPDATE ON public.user_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to add points to user score
CREATE OR REPLACE FUNCTION public.add_points_to_user(user_id UUID, points INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_scores (user_id, total_points)
  VALUES (user_id, points)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    total_points = user_scores.total_points + points,
    updated_at = now();
END;
$$;

-- Function to create activity and award points
CREATE OR REPLACE FUNCTION public.create_activity_with_points(
  user_id UUID,
  activity_type TEXT,
  activity_data JSONB DEFAULT NULL,
  target_user_id UUID DEFAULT NULL,
  points INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert activity record
  INSERT INTO public.user_activities (user_id, activity_type, activity_data, target_user_id, points_awarded)
  VALUES (user_id, activity_type, activity_data, target_user_id, points);
  
  -- Add points to user score if points > 0
  IF points > 0 THEN
    PERFORM public.add_points_to_user(user_id, points);
  END IF;
END;
$$;