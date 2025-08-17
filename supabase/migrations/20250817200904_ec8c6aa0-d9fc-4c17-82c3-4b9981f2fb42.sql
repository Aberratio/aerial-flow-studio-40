-- ============================================================
-- SECURITY FIX: Implement proper RLS policies for posts and related tables
-- ============================================================

-- First, let's create a helper function to check if users are friends or following each other
CREATE OR REPLACE FUNCTION public.can_view_user_content(viewer_id uuid, content_owner_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Always allow users to view their own content
  IF viewer_id = content_owner_id THEN
    RETURN true;
  END IF;
  
  -- Check if users are friends (accepted friendship)
  IF EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND (
      (requester_id = viewer_id AND addressee_id = content_owner_id) OR
      (requester_id = content_owner_id AND addressee_id = viewer_id)
    )
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if viewer is following the content owner
  IF EXISTS (
    SELECT 1 FROM public.user_follows 
    WHERE follower_id = viewer_id AND following_id = content_owner_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- ============================================================
-- UPDATE POSTS TABLE RLS POLICIES
-- ============================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;

-- Create new privacy-aware policies for posts
CREATE POLICY "Users can view public posts" 
ON public.posts 
FOR SELECT 
USING (privacy = 'public');

CREATE POLICY "Users can view private posts from friends/followed users" 
ON public.posts 
FOR SELECT 
USING (
  privacy = 'private' 
  AND public.can_view_user_content(auth.uid(), user_id)
);

CREATE POLICY "Users can view their own posts" 
ON public.posts 
FOR SELECT 
USING (auth.uid() = user_id);

-- ============================================================
-- UPDATE POST_COMMENTS TABLE RLS POLICIES
-- ============================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all comments" ON public.post_comments;

-- Create new privacy-aware policy for comments
CREATE POLICY "Users can view comments on accessible posts" 
ON public.post_comments 
FOR SELECT 
USING (
  post_id IN (
    SELECT id FROM public.posts 
    WHERE 
      privacy = 'public' 
      OR (privacy = 'private' AND public.can_view_user_content(auth.uid(), user_id))
      OR user_id = auth.uid()
  )
);

-- ============================================================
-- UPDATE POST_LIKES TABLE RLS POLICIES
-- ============================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all likes" ON public.post_likes;

-- Create new privacy-aware policy for likes
CREATE POLICY "Users can view likes on accessible posts" 
ON public.post_likes 
FOR SELECT 
USING (
  post_id IN (
    SELECT id FROM public.posts 
    WHERE 
      privacy = 'public' 
      OR (privacy = 'private' AND public.can_view_user_content(auth.uid(), user_id))
      OR user_id = auth.uid()
  )
);

-- ============================================================
-- UPDATE USER_FOLLOWS TABLE RLS POLICIES
-- ============================================================

-- Drop existing overly permissive policy  
DROP POLICY IF EXISTS "Users can view all follows" ON public.user_follows;

-- Create more restrictive policy for follows
CREATE POLICY "Users can view their own follows" 
ON public.user_follows 
FOR SELECT 
USING (
  follower_id = auth.uid() 
  OR following_id = auth.uid()
);

CREATE POLICY "Users can view public follow relationships of friends" 
ON public.user_follows 
FOR SELECT 
USING (
  public.can_view_user_content(auth.uid(), follower_id) 
  OR public.can_view_user_content(auth.uid(), following_id)
);

-- ============================================================
-- UPDATE PROFILES TABLE RLS POLICIES  
-- ============================================================

-- The existing policies are mostly good, but let's add one more restriction
-- Drop the overly broad policy that allows viewing all other profiles
DROP POLICY IF EXISTS "Users can view limited public profile data" ON public.profiles;

-- Create more restrictive policy for viewing other profiles
CREATE POLICY "Users can view public profiles of friends and followed users" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid() <> id 
  AND public.can_view_user_content(auth.uid(), id)
);

-- Allow viewing basic profile info for post authors (for attribution)
CREATE POLICY "Users can view basic profile info for accessible content creators" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid() <> id
  AND (
    -- User has created public posts
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE user_id = id AND privacy = 'public'
    )
    -- Or user has created accessible private posts
    OR EXISTS (
      SELECT 1 FROM public.posts 
      WHERE user_id = id 
      AND privacy = 'private' 
      AND public.can_view_user_content(auth.uid(), user_id)
    )
  )
);

COMMENT ON FUNCTION public.can_view_user_content IS 'Security function to check if a viewer can access content from another user based on friendship/follow relationships';