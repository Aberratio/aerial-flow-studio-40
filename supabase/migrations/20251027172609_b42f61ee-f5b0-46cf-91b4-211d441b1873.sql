-- Add new columns to challenges table for series grouping and new badge
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS series_name TEXT,
ADD COLUMN IF NOT EXISTS series_order INTEGER,
ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;

-- Create index for efficient series grouping
CREATE INDEX IF NOT EXISTS idx_challenges_series 
ON public.challenges(series_name, series_order) 
WHERE series_name IS NOT NULL;

-- Create function to automatically mark new challenges
CREATE OR REPLACE FUNCTION mark_new_challenges()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_new := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-mark challenges as new
DROP TRIGGER IF EXISTS trigger_mark_new_challenges ON public.challenges;
CREATE TRIGGER trigger_mark_new_challenges
BEFORE INSERT ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION mark_new_challenges();

-- Create function to unmark old challenges (older than 14 days)
CREATE OR REPLACE FUNCTION unmark_old_challenges()
RETURNS void AS $$
BEGIN
  UPDATE public.challenges
  SET is_new = false
  WHERE is_new = true 
  AND created_at < NOW() - INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the is_new column
COMMENT ON COLUMN public.challenges.is_new IS 'Automatically set to true for challenges created within 14 days';
COMMENT ON COLUMN public.challenges.series_name IS 'Name of the challenge series for grouping (e.g., "Plank Power")';
COMMENT ON COLUMN public.challenges.series_order IS 'Order within the series (e.g., 1, 2, 3, etc.)';