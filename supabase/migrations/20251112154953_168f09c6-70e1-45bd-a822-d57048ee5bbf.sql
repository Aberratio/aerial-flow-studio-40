-- Add play_video column to training_day_exercises table
ALTER TABLE training_day_exercises 
ADD COLUMN play_video boolean DEFAULT true;

COMMENT ON COLUMN training_day_exercises.play_video IS 
'Whether to play video during exercise (if figure has video_url). Defaults to true.';