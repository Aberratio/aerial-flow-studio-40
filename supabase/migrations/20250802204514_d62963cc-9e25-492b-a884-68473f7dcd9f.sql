-- Create user_journeys table for aerial journey feature
CREATE TABLE public.user_journeys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport_type TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  goals TEXT[] NOT NULL DEFAULT '{}',
  current_streak INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  badges_earned TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own journey" 
ON public.user_journeys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journey" 
ON public.user_journeys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journey" 
ON public.user_journeys 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journey" 
ON public.user_journeys 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_journeys_updated_at
BEFORE UPDATE ON public.user_journeys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();