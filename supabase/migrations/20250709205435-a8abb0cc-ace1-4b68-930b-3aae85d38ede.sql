-- Add tags column to figures table
ALTER TABLE figures ADD COLUMN tags TEXT[];

-- Add index for better performance when filtering by tags
CREATE INDEX idx_figures_tags ON figures USING GIN(tags);