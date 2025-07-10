import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useMutualFriends = (userId1: string, userId2: string) => {
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [mutualCount, setMutualCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMutualFriends = async () => {
      if (!userId1 || !userId2 || userId1 === userId2) {
        setMutualFriends([]);
        setMutualCount(0);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get friends of user1 (people user1 is following with accepted status)
        const { data: user1Friends, error: error1 } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId1)
          .eq('status', 'accepted');

        if (error1) throw error1;

        // Get friends of user2 (people user2 is following with accepted status)
        const { data: user2Friends, error: error2 } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId2)
          .eq('status', 'accepted');

        if (error2) throw error2;

        // Find common friend IDs
        const user1FriendIds = new Set(user1Friends?.map(f => f.following_id) || []);
        const user2FriendIds = new Set(user2Friends?.map(f => f.following_id) || []);
        
        const mutualFriendIds = [...user1FriendIds].filter(id => user2FriendIds.has(id));

        if (mutualFriendIds.length > 0) {
          // Get profile information for mutual friends
          const { data: mutualFriendsProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', mutualFriendIds);

          if (profilesError) throw profilesError;

          setMutualFriends(mutualFriendsProfiles || []);
          setMutualCount(mutualFriendsProfiles?.length || 0);
        } else {
          setMutualFriends([]);
          setMutualCount(0);
        }
      } catch (error) {
        console.error('Error fetching mutual friends:', error);
        setMutualFriends([]);
        setMutualCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMutualFriends();
  }, [userId1, userId2]);

  return { mutualFriends, mutualCount, loading };
};