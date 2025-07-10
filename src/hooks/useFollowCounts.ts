import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFollowCounts = (userId: string) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    if (!userId) {
      setFollowersCount(0);
      setFollowingCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get followers count (people who are following this user)
      const { count: followersCount, error: followersError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .eq('status', 'accepted');

      if (followersError) throw followersError;

      // Get following count (people this user is following)
      const { count: followingCount, error: followingError } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
        .eq('status', 'accepted');

      if (followingError) throw followingError;

      setFollowersCount(followersCount || 0);
      setFollowingCount(followingCount || 0);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
      setFollowersCount(0);
      setFollowingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [userId]);

  const refetchCounts = () => {
    fetchCounts();
  };

  return { followersCount, followingCount, loading, refetchCounts };
};