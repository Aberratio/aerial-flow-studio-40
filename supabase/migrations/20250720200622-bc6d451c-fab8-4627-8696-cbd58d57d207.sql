-- Remove the unique constraint that prevents multiple attempts for the same day
ALTER TABLE challenge_day_progress DROP CONSTRAINT IF EXISTS challenge_day_progress_user_id_challenge_id_training_day_id_key;

-- Create a new unique constraint that includes attempt_number to allow multiple attempts
ALTER TABLE challenge_day_progress ADD CONSTRAINT challenge_day_progress_user_challenge_day_attempt_unique 
UNIQUE (user_id, challenge_id, training_day_id, attempt_number);