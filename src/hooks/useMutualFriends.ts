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

        // Get friends of user1 (accepted friendships)
        const { data: user1Friendships, error: error1 } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${userId1},addressee_id.eq.${userId1}`);

        if (error1) throw error1;

        // Get friends of user2 (accepted friendships)
        const { data: user2Friendships, error: error2 } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${userId2},addressee_id.eq.${userId2}`);

        if (error2) throw error2;

        // Extract friend IDs for both users
        const user1FriendIds = new Set<string>();
        user1Friendships?.forEach(friendship => {
          if (friendship.requester_id === userId1) {
            user1FriendIds.add(friendship.addressee_id);
          } else {
            user1FriendIds.add(friendship.requester_id);
          }
        });

        const user2FriendIds = new Set<string>();
        user2Friendships?.forEach(friendship => {
          if (friendship.requester_id === userId2) {
            user2FriendIds.add(friendship.addressee_id);
          } else {
            user2FriendIds.add(friendship.requester_id);
          }
        });

        // Find common friend IDs
        
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