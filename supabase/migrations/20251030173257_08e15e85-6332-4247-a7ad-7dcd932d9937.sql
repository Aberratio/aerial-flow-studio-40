-- Step 1: Drop existing check constraints on figures table
ALTER TABLE public.figures DROP CONSTRAINT IF EXISTS figures_difficulty_level_check;
ALTER TABLE public.figures DROP CONSTRAINT IF EXISTS figures_type_check;
ALTER TABLE public.figures DROP CONSTRAINT IF EXISTS figures_category_check;

-- Step 2: Create figure_difficulty_levels table
CREATE TABLE IF NOT EXISTS public.figure_difficulty_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name_pl TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  color_class TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Create figure_types table
CREATE TABLE IF NOT EXISTS public.figure_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name_pl TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 4: Populate figure_difficulty_levels
INSERT INTO public.figure_difficulty_levels (key, name_pl, order_index, color_class) VALUES
  ('beginner', 'Początkujący', 1, 'bg-green-500/20 text-green-400 border-green-400/30'),
  ('intermediate', 'Średniozaawansowany', 2, 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30'),
  ('advanced', 'Zaawansowany', 3, 'bg-red-500/20 text-red-400 border-red-400/30')
ON CONFLICT (key) DO NOTHING;

-- Step 5: Populate figure_types
INSERT INTO public.figure_types (key, name_pl, order_index) VALUES
  ('single_figure', 'Pojedyncza figura', 1),
  ('combo', 'Kombo', 2),
  ('warm_up', 'Rozgrzewka', 3),
  ('stretching', 'Rozciąganie', 4)
ON CONFLICT (key) DO NOTHING;

-- Step 6: Normalize existing difficulty_level values in figures
UPDATE public.figures SET difficulty_level = 'beginner' WHERE difficulty_level = 'Beginner';
UPDATE public.figures SET difficulty_level = 'intermediate' WHERE difficulty_level = 'Intermediate';
UPDATE public.figures SET difficulty_level = 'advanced' WHERE difficulty_level = 'Advanced';

-- Step 7: Fix the "single figure" bug - change to "single_figure"
UPDATE public.figures SET type = 'single_figure' WHERE type = 'single figure';

-- Step 8: Normalize category values to match sport_categories keys
UPDATE public.figures SET category = 'core' WHERE category = 'Core';
UPDATE public.figures SET category = 'silks' WHERE category = 'Silks';
UPDATE public.figures SET category = 'hoop' WHERE category = 'Hoop';
UPDATE public.figures SET category = 'pole' WHERE category = 'Pole';
UPDATE public.figures SET category = 'hammock' WHERE category = 'Hammock';

-- Step 9: Add sport_category_id column to figures (nullable for now)
ALTER TABLE public.figures ADD COLUMN IF NOT EXISTS sport_category_id UUID REFERENCES public.sport_categories(id);

-- Step 10: Migrate existing category text values to sport_category_id
UPDATE public.figures 
SET sport_category_id = (
  SELECT id FROM public.sport_categories 
  WHERE key_name = figures.category
)
WHERE category IS NOT NULL AND sport_category_id IS NULL;

-- Step 11: Create helpful view for figures with translations
CREATE OR REPLACE VIEW public.figures_with_translations AS
SELECT 
  f.*,
  fdl.name_pl as difficulty_name_pl,
  fdl.order_index as difficulty_order,
  fdl.color_class as difficulty_color_class,
  ft.name_pl as type_name_pl,
  sc.name as category_name_pl,
  sc.key_name as category_key
FROM public.figures f
LEFT JOIN public.figure_difficulty_levels fdl ON f.difficulty_level = fdl.key
LEFT JOIN public.figure_types ft ON f.type = ft.key
LEFT JOIN public.sport_categories sc ON f.sport_category_id = sc.id;

-- Step 12: Add RLS policies for figure_difficulty_levels
ALTER TABLE public.figure_difficulty_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view difficulty levels"
  ON public.figure_difficulty_levels
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage difficulty levels"
  ON public.figure_difficulty_levels
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Step 13: Add RLS policies for figure_types
ALTER TABLE public.figure_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view figure types"
  ON public.figure_types
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage figure types"
  ON public.figure_types
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'
    )
  );

-- Step 14: Add updated_at trigger for new tables
CREATE TRIGGER update_figure_difficulty_levels_updated_at
  BEFORE UPDATE ON public.figure_difficulty_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_figure_types_updated_at
  BEFORE UPDATE ON public.figure_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();