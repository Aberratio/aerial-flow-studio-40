-- Fix security warning: Drop trigger first, then recreate function with proper search_path
DROP TRIGGER IF EXISTS create_bidirectional_similarity_trigger ON public.similar_figures;
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

-- Recreate trigger
CREATE TRIGGER create_bidirectional_similarity_trigger
  AFTER INSERT ON public.similar_figures
  FOR EACH ROW
  EXECUTE FUNCTION public.create_bidirectional_similarity();