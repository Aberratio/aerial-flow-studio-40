
-- Add a status column to user_follows to track request states
ALTER TABLE user_follows ADD COLUMN status TEXT DEFAULT 'pending';

-- Update existing follows to be 'accepted' (to maintain current friendships)
UPDATE user_follows SET status = 'accepted';

-- Add constraint to ensure valid status values
ALTER TABLE user_follows ADD CONSTRAINT user_follows_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Create an index for better performance on status queries
CREATE INDEX idx_user_follows_status ON user_follows(status);
CREATE INDEX idx_user_follows_following_status ON user_follows(following_id, status);
CREATE INDEX idx_user_follows_follower_status ON user_follows(follower_id, status);

-- Update the updated_at trigger for user_follows if it doesn't exist
CREATE OR REPLACE FUNCTION update_user_follows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_follows' AND column_name='updated_at') THEN
        ALTER TABLE user_follows ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_follows_updated_at_trigger ON user_follows;
CREATE TRIGGER update_user_follows_updated_at_trigger
    BEFORE UPDATE ON user_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_user_follows_updated_at();
