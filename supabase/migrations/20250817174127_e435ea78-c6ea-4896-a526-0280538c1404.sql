-- Add published status and additional fields to training_sessions table
ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS difficulty_level text,
ADD COLUMN IF NOT EXISTS warmup_exercises jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS figures jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS stretching_exercises jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS playlist text,
ADD COLUMN IF NOT EXISTS thumbnail_url text;