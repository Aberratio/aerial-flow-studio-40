-- Create ENUM type for video position
CREATE TYPE video_position_type AS ENUM ('center', 'top', 'bottom', 'left', 'right');

-- Add column to training_day_exercises
ALTER TABLE training_day_exercises 
ADD COLUMN video_position video_position_type DEFAULT 'center';

COMMENT ON COLUMN training_day_exercises.video_position IS 
'Position of video when cropped (object-position CSS property). Applies to all instances of the same figure in challenge.';