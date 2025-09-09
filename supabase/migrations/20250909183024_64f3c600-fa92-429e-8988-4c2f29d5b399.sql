-- Add completion_mode column to training_day_exercises table
ALTER TABLE public.training_day_exercises 
ADD COLUMN completion_mode text DEFAULT 'time' CHECK (completion_mode IN ('time', 'completion'));