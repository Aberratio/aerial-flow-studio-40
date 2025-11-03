-- 1. Dodaj nowy typ do figure_types
INSERT INTO figure_types (key, name_pl, order_index)
VALUES ('transitions', 'Przejścia', 5)
ON CONFLICT (key) DO NOTHING;

-- 2. Dodaj kolumny do figures
ALTER TABLE figures 
ADD COLUMN IF NOT EXISTS transition_from_figure_id uuid REFERENCES figures(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS transition_to_figure_id uuid REFERENCES figures(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS audio_url text;

-- 3. Dodaj komentarze
COMMENT ON COLUMN figures.transition_from_figure_id IS 'Figura Z której przechodzimy (tylko dla typu transitions)';
COMMENT ON COLUMN figures.transition_to_figure_id IS 'Figura DO której przechodzimy (tylko dla typu transitions)';
COMMENT ON COLUMN figures.audio_url IS 'URL pliku audio z instrukcjami (opcjonalnie)';

-- 4. RLS Policies - tylko admini mogą tworzyć/edytować transitions
DROP POLICY IF EXISTS "Only admins can create transitions" ON figures;
CREATE POLICY "Only admins can create transitions"
ON figures
FOR INSERT
WITH CHECK (
  (type != 'transitions') 
  OR 
  (type = 'transitions' AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ))
);

DROP POLICY IF EXISTS "Only admins can edit transitions" ON figures;
CREATE POLICY "Only admins can edit transitions"
ON figures
FOR UPDATE
USING (
  (type != 'transitions') 
  OR 
  (type = 'transitions' AND auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ))
);