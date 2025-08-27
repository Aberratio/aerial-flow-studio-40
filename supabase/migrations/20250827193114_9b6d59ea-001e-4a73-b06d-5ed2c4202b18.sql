-- Fix the RLS policy for viewing basic profile info of content creators
-- The current policy has a bug where it checks posts.user_id = posts.id instead of posts.user_id = profiles.id

DROP POLICY IF EXISTS "Users can view basic profile info for accessible content creato" ON public.profiles;

CREATE POLICY "Users can view basic profile info for content creators" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.role() = 'authenticated'::text) 
  AND (auth.uid() <> id) 
  AND (
    (EXISTS (
      SELECT 1 FROM posts
      WHERE posts.user_id = profiles.id AND posts.privacy = 'public'::text
    )) 
    OR 
    (EXISTS (
      SELECT 1 FROM posts
      WHERE posts.user_id = profiles.id AND posts.privacy = 'private'::text AND can_view_user_content(auth.uid(), posts.user_id)
    ))
  )
);