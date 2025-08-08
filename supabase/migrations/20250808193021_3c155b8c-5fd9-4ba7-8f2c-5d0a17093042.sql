-- Create sport_categories table to manage sport publication status
CREATE TABLE public.sport_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sport_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for sport_categories
CREATE POLICY "Everyone can view published sport categories" 
ON public.sport_categories 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can view all sport categories" 
ON public.sport_categories 
FOR SELECT 
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'::user_role
));

CREATE POLICY "Admins can manage sport categories" 
ON public.sport_categories 
FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'::user_role
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'::user_role
));

-- Insert existing sport categories based on sport_levels data
INSERT INTO public.sport_categories (name, is_published, created_at)
SELECT DISTINCT 
  sport_category as name,
  true as is_published, -- Assume existing categories are published
  now() as created_at
FROM public.sport_levels
WHERE sport_category IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_sport_categories_updated_at
  BEFORE UPDATE ON public.sport_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();