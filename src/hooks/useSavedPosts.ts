import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { FeedPost } from '@/hooks/useFeedPosts';

export const useSavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSavedPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get saved posts for the current user
      const { data: savedData, error } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!savedData || savedData.length === 0) {
        setSavedPosts([]);
        return;
      }

      const postIds = savedData.map(s => s.post_id);

      // Get the actual posts data
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          created_at,
          user_id,
          profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .in('id', postIds);

      if (postsError) throw postsError;

      // Transform saved posts data
      if (postsData) {
        const postsWithCounts = await Promise.all(
          postsData.map(async (post) => {
            if (!post) return null;

            // Get likes count
            const { count: likesCount } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            // Get comments count
            const { count: commentsCount } = await supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            // Check if current user liked this post
            const { data: userLike } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();

            return {
              id: post.id,
              content: post.content,
              image_url: post.image_url,
              video_url: post.video_url,
              created_at: post.created_at,
              user_id: post.user_id,
              user: {
                id: post.profiles?.id || '',
                username: post.profiles?.username || '',
                avatar_url: post.profiles?.avatar_url || null,
                role: post.profiles?.role || 'free',
              },
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              is_liked: !!userLike,
              is_saved: true, // Always true for saved posts
            };
          })
        );

        setSavedPosts(postsWithCounts.filter(Boolean) as FeedPost[]);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, [user]);

  return {
    savedPosts,
    loading,
    refetch: fetchSavedPosts,
  };
};