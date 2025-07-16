-- Add premium column to figures table
ALTER TABLE public.figures 
ADD COLUMN premium BOOLEAN NOT NULL DEFAULT false;

-- Update existing figures to be free by default
UPDATE public.figures SET premium = false WHERE premium IS NULL;