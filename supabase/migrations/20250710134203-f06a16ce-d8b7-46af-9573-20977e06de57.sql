-- Add read status to user_activities table
ALTER TABLE public.user_activities 
ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on read status
CREATE INDEX idx_user_activities_read 
ON public.user_activities (user_id, is_read, created_at);