-- Remove unused video_url and audio_url columns from training_day_exercises
-- These columns are empty and not used in the application

ALTER TABLE public.training_day_exercises DROP COLUMN IF EXISTS video_url;
ALTER TABLE public.training_day_exercises DROP COLUMN IF EXISTS audio_url;