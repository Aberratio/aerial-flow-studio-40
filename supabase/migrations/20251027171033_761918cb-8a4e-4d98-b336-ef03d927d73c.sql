-- ETAP 3.1: Zmiana kolumn start_date i end_date na nullable
-- Daty nie są używane w logice challenges, tylko do wyświetlania

ALTER TABLE public.challenges 
  ALTER COLUMN start_date DROP NOT NULL,
  ALTER COLUMN end_date DROP NOT NULL;

-- Dodaj komentarze wyjaśniające
COMMENT ON COLUMN public.challenges.start_date IS 
  'Optional: Not used for challenge logic. Only for display/statistics. Challenge progression is based on day_number.';

COMMENT ON COLUMN public.challenges.end_date IS 
  'Optional: Not used for challenge logic. Only for display/statistics. Challenge progression is based on day_number.';