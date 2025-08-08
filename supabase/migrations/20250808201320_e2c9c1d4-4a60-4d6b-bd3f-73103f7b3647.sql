-- Add status field to sport_levels table for published/draft functionality
ALTER TABLE public.sport_levels 
ADD COLUMN status text NOT NULL DEFAULT 'draft'
CHECK (status IN ('draft', 'published'));

-- Add index for better performance when filtering by status
CREATE INDEX idx_sport_levels_status ON public.sport_levels(status);

-- Update existing records to be published by default (assuming they were live)
UPDATE public.sport_levels SET status = 'published';