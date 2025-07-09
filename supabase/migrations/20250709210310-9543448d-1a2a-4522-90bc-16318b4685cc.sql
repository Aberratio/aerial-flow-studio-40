-- Add category, level, and type columns to figures table if they don't exist
ALTER TABLE figures ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE figures ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE figures ADD COLUMN IF NOT EXISTS type TEXT;