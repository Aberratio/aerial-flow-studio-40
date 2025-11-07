-- Add sublevel columns to level_figures
ALTER TABLE level_figures 
ADD COLUMN sublevel integer NOT NULL DEFAULT 1,
ADD COLUMN sublevel_description text;

-- Add index for performance
CREATE INDEX idx_level_figures_sublevel ON level_figures(level_id, sublevel);

COMMENT ON COLUMN level_figures.sublevel IS 'Sublevel number within the level (default 1)';
COMMENT ON COLUMN level_figures.sublevel_description IS 'Optional description for the sublevel group';

-- Create sport_level_achievements table
CREATE TABLE sport_level_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_level_id uuid NOT NULL REFERENCES sport_levels(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  
  UNIQUE(sport_level_id, achievement_id)
);

-- RLS Policies for sport_level_achievements
ALTER TABLE sport_level_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view sport level achievements"
  ON sport_level_achievements FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage sport level achievements"
  ON sport_level_achievements FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Function to award achievements when level is completed
CREATE OR REPLACE FUNCTION award_sport_level_achievements(
  p_user_id uuid,
  p_sport_level_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Award all achievements linked to this level
  INSERT INTO user_achievements (user_id, achievement_id, earned_at)
  SELECT 
    p_user_id,
    sla.achievement_id,
    now()
  FROM sport_level_achievements sla
  WHERE sla.sport_level_id = p_sport_level_id
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
END;
$$;