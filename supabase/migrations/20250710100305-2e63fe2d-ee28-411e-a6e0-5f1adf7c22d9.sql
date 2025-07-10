-- Add status column to challenge_participants table to track completion status
ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraint to ensure valid status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'challenge_participants' 
        AND constraint_name = 'challenge_participants_status_check'
    ) THEN
        ALTER TABLE challenge_participants 
        ADD CONSTRAINT challenge_participants_status_check 
        CHECK (status IN ('active', 'completed', 'failed', 'paused'));
    END IF;
END $$;