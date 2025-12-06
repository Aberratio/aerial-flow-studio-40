-- Drop the existing foreign key constraint
ALTER TABLE public.level_trainings 
DROP CONSTRAINT IF EXISTS level_trainings_training_id_fkey;

-- Add new foreign key referencing training_sessions
ALTER TABLE public.level_trainings
ADD CONSTRAINT level_trainings_training_id_fkey 
FOREIGN KEY (training_id) 
REFERENCES public.training_sessions(id)
ON DELETE CASCADE;