-- Add changed_status_at column and remove completed_at and scheduled_date
ALTER TABLE challenge_day_progress 
ADD COLUMN changed_status_at timestamp with time zone DEFAULT now();

-- Remove the old columns
ALTER TABLE challenge_day_progress 
DROP COLUMN completed_at,
DROP COLUMN scheduled_date;