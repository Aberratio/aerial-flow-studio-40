-- Add missing updated_at column to challenge_participants and trigger to maintain it
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'challenge_participants' 
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.challenge_participants
      ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Ensure trigger exists to keep updated_at fresh on updates
DROP TRIGGER IF EXISTS update_challenge_participants_updated_at ON public.challenge_participants;
CREATE TRIGGER update_challenge_participants_updated_at
BEFORE UPDATE ON public.challenge_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Optional: comment for clarity
COMMENT ON TRIGGER update_challenge_participants_updated_at ON public.challenge_participants IS 'Maintains updated_at timestamp on updates';