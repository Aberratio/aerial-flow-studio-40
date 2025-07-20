-- Add type column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN type text NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'timer'));