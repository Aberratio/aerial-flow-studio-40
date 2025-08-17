-- Add type column to training_sessions table
ALTER TABLE public.training_sessions 
ADD COLUMN type text NOT NULL DEFAULT 'timer';

-- Add check constraint to ensure only valid types
ALTER TABLE public.training_sessions 
ADD CONSTRAINT training_sessions_type_check 
CHECK (type IN ('timer', 'manual'));