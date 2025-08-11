-- Remove level column from figures table
ALTER TABLE public.figures DROP COLUMN IF EXISTS level;