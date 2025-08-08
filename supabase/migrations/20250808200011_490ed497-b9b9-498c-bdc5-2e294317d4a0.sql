-- Add challenge_id column to sport_levels table to link challenges to levels
ALTER TABLE public.sport_levels 
ADD COLUMN challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL;