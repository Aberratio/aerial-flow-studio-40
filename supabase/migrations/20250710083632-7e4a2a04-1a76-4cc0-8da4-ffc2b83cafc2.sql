
-- Create table to link challenges with achievements
CREATE TABLE public.challenge_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, achievement_id)
);

-- Create table for challenge training days
CREATE TABLE public.challenge_training_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenge_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_training_days ENABLE ROW LEVEL SECURITY;

-- Create policies for challenge_achievements
CREATE POLICY "Everyone can view challenge achievements" 
ON public.challenge_achievements 
FOR SELECT 
USING (true);

CREATE POLICY "Trainers can manage challenge achievements" 
ON public.challenge_achievements 
FOR ALL 
USING (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role]))));

-- Create policies for challenge_training_days
CREATE POLICY "Everyone can view challenge training days" 
ON public.challenge_training_days 
FOR SELECT 
USING (true);

CREATE POLICY "Trainers can manage challenge training days" 
ON public.challenge_training_days 
FOR ALL 
USING (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role]))));
