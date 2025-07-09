-- Fix storage policies for avatars bucket
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

CREATE POLICY "Users can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete avatars" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Fix storage policies for posts bucket  
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;

CREATE POLICY "Users can delete post images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'posts' AND auth.uid() IS NOT NULL);