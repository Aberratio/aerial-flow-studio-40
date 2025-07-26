-- Add premium flag to challenges table
ALTER TABLE public.challenges 
ADD COLUMN premium boolean NOT NULL DEFAULT false;