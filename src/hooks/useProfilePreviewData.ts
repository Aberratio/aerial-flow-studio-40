import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  profile: any;
  posts: any[];
  achievements: any[];
  loading: boolean;
}

export const useProfilePreviewData = (userId: string, isOpen: boolean) => {
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

      // Fetch public posts
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
        posts: postsData || [],
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