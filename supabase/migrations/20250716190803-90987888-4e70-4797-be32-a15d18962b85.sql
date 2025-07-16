-- Add column to track if user has seen the introduction
ALTER TABLE profiles ADD COLUMN has_seen_intro BOOLEAN DEFAULT FALSE;

-- Update existing users to have seen the intro (so they don't see it)
UPDATE profiles SET has_seen_intro = TRUE;