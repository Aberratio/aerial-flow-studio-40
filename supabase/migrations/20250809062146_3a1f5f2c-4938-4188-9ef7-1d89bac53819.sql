-- Add new fields to sport_categories table
ALTER TABLE public.sport_categories 
ADD COLUMN key_name text,
ADD COLUMN icon text,
ADD COLUMN image_file_url text;

-- Update existing records to have key_name based on name (convert to lowercase and replace spaces with underscores)
UPDATE public.sport_categories 
SET key_name = lower(replace(name, ' ', '_'));

-- Make key_name required and unique going forward
ALTER TABLE public.sport_categories 
ALTER COLUMN key_name SET NOT NULL;

-- Add unique constraint on key_name
ALTER TABLE public.sport_categories 
ADD CONSTRAINT sport_categories_key_name_unique UNIQUE (key_name);