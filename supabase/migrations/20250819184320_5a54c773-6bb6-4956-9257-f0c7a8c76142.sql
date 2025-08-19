-- Fix security warning: Set search_path for the function
DROP FUNCTION IF EXISTS public.create_bidirectional_similarity();

CREATE OR REPLACE FUNCTION public.create_bidirectional_similarity()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the reverse relationship if it doesn't exist
  INSERT INTO public.similar_figures (figure_id, similar_figure_id, created_by)
  VALUES (NEW.similar_figure_id, NEW.figure_id, NEW.created_by)
  ON CONFLICT (figure_id, similar_figure_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;