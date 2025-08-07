-- Add point_limit column to sport_levels table
ALTER TABLE public.sport_levels 
ADD COLUMN point_limit integer NOT NULL DEFAULT 0;