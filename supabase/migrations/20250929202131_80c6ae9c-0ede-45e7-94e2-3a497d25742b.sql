-- Add hold_time_seconds column to figures table for default hold time
ALTER TABLE public.figures 
ADD COLUMN hold_time_seconds integer DEFAULT NULL;

-- Add comment to explain the purpose
COMMENT ON COLUMN public.figures.hold_time_seconds IS 'Default hold time in seconds for this exercise (especially important for core exercises like planks)';