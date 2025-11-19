-- Add video_position and play_video columns to figures table
ALTER TABLE figures 
ADD COLUMN IF NOT EXISTS video_position text DEFAULT 'center' CHECK (video_position IN ('center', 'top', 'bottom', 'left', 'right')),
ADD COLUMN IF NOT EXISTS play_video boolean DEFAULT true;

-- Copy existing settings from training_day_exercises to figures
-- For each exercise, find the most commonly used video position
UPDATE figures f
SET video_position = COALESCE(
  (SELECT video_position 
   FROM training_day_exercises 
   WHERE figure_id = f.id AND video_position IS NOT NULL 
   GROUP BY video_position 
   ORDER BY COUNT(*) DESC 
   LIMIT 1),
  'center'
),
play_video = COALESCE(
  (SELECT play_video 
   FROM training_day_exercises 
   WHERE figure_id = f.id AND play_video IS NOT NULL 
   GROUP BY play_video 
   ORDER BY COUNT(*) DESC 
   LIMIT 1),
  true
);