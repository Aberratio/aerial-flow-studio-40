-- Add figure_id column to posts table to link posts to specific figures
ALTER TABLE posts ADD COLUMN figure_id UUID REFERENCES figures(id) ON DELETE SET NULL;