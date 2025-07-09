-- Check current constraint and fix difficulty levels
-- First, let's see what constraint exists and remove it
ALTER TABLE figures DROP CONSTRAINT IF EXISTS figures_difficulty_level_check;

-- Add a proper constraint that matches our UI values
ALTER TABLE figures ADD CONSTRAINT figures_difficulty_level_check 
CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert') OR difficulty_level IS NULL);