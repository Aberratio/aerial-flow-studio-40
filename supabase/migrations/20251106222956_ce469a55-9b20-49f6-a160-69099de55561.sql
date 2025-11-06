-- Add description field to sport_levels table
ALTER TABLE sport_levels 
ADD COLUMN description text;

COMMENT ON COLUMN sport_levels.description IS 'Optional text description for the sport level';
