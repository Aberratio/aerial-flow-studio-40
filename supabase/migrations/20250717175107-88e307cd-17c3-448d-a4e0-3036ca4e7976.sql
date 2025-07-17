-- Add synonyms column to figures table
ALTER TABLE public.figures 
ADD COLUMN synonyms TEXT[] DEFAULT '{}'::TEXT[];