-- Create sport_levels table for custom levels per sport
CREATE TABLE public.sport_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sport_category text NOT NULL,
  level_number integer NOT NULL,
  level_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(sport_category, level_number)
);

-- Create level_figures table to associate figures with levels
CREATE TABLE public.level_figures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id uuid NOT NULL REFERENCES public.sport_levels(id) ON DELETE CASCADE,
  figure_id uuid NOT NULL REFERENCES public.figures(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(level_id, figure_id)
);

-- Enable RLS on both tables
ALTER TABLE public.sport_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_figures ENABLE ROW LEVEL SECURITY;

-- RLS policies for sport_levels
CREATE POLICY "Everyone can view sport levels"
ON public.sport_levels
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage sport levels"
ON public.sport_levels
FOR ALL
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role = 'admin'
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role = 'admin'
));

-- RLS policies for level_figures
CREATE POLICY "Everyone can view level figures"
ON public.level_figures
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage level figures"
ON public.level_figures
FOR ALL
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role = 'admin'
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role = 'admin'
));

-- Add trigger for updating updated_at on sport_levels
CREATE TRIGGER update_sport_levels_updated_at
BEFORE UPDATE ON public.sport_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();