-- Add policy to allow users to delete their own challenge participation
CREATE POLICY "Users can delete their own participation" ON public.challenge_participants 
FOR DELETE USING (auth.uid() = user_id);