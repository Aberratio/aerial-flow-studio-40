import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileData {
  profile: any;
  posts: any[];
  achievements: any[];
  loading: boolean;
}

export const useProfilePreviewData = (userId: string, isOpen: boolean) => {
  const { user } = useAuth();
  const [data, setData] = useState<ProfileData>({
    profile: null,
    posts: [],
    achievements: [],
    loading: true
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfileData();
    }
  }, [isOpen, userId]);

  const fetchProfileData = async () => {
    if (!userId) return;

    try {
      setData(prev => ({ ...prev, loading: true }));

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch public posts with interaction data
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            avatar_url
          ),
          figures (
            name
          )
        `)
        .eq('user_id', userId)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(6);

      if (postsError) throw postsError;

      // Get likes and comments counts for each post (same as feed)
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
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
            .eq('user_id', user?.id || '')
            .maybeSingle();

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: !!userLike,
          };
        })
      );

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (
            name,
            description,
            icon,
            points
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(4);

      if (achievementsError) throw achievementsError;

      setData({
        profile: profileData,
        posts: postsWithCounts || [],
        achievements: achievementsData || [],
        loading: false
      });

    } catch (error) {
      console.error('Error fetching profile data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  return data;
};