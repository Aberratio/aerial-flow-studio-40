-- Add level column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN level integer;