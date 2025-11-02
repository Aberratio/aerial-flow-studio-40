-- Add new columns to level_figures for boss functionality and level-specific parameters
ALTER TABLE level_figures
ADD COLUMN IF NOT EXISTS is_boss BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS boss_description TEXT,
ADD COLUMN IF NOT EXISTS hold_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS reps INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Copy default hold times from figures to level_figures for existing records
UPDATE level_figures lf
SET hold_time_seconds = f.hold_time_seconds
FROM figures f
WHERE lf.figure_id = f.id 
  AND lf.hold_time_seconds IS NULL 
  AND f.hold_time_seconds IS NOT NULL;

-- Add constraint: only one boss figure per level
CREATE UNIQUE INDEX IF NOT EXISTS unique_boss_per_level 
ON level_figures (level_id) 
WHERE is_boss = true;

-- Remove unique constraint on (level_id, figure_id) to allow figure duplication across levels
DO $$ 
BEGIN
  -- Drop unique constraint if it exists (this will also drop the index)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'level_figures_level_id_figure_id_key'
      AND table_name = 'level_figures'
  ) THEN
    ALTER TABLE level_figures DROP CONSTRAINT level_figures_level_id_figure_id_key;
  END IF;
END $$;