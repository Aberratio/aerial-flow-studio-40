import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FriendshipStatus {
  isFriend: boolean;
  isFollowing: boolean;
  pendingFriendRequest: 'none' | 'sent' | 'received';
  loading: boolean;
}

export const useFriendshipStatus = (userId: string) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<FriendshipStatus>({
    isFriend: false,
    isFollowing: false,
    pendingFriendRequest: 'none',
    loading: true
  });

  useEffect(() => {
    if (!user || !userId || user.id === userId) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchStatus = async () => {
      try {
        // Check friendship status
        const { data: friendshipData } = await supabase
          .from('friendships')
          .select('status, requester_id')
          .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
          .maybeSingle();

        // Check following status
        const { data: followData } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle();

        let pendingFriendRequest: 'none' | 'sent' | 'received' = 'none';
        let isFriend = false;

        if (friendshipData) {
          if (friendshipData.status === 'accepted') {
            isFriend = true;
          } else if (friendshipData.status === 'pending') {
            pendingFriendRequest = friendshipData.requester_id === user.id ? 'sent' : 'received';
          }
        }

        setStatus({
          isFriend,
          isFollowing: !!followData,
          pendingFriendRequest,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching friendship status:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStatus();
  }, [user, userId]);

  const sendFriendRequest = async () => {
    if (!user || !userId) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      // Award points for sending friend request
      await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: 'friend_request_sent',
          activity_data: { addressee_id: userId },
          target_user_id: userId,
          points_awarded: 2
        });

      // Add points to user score
      await supabase.rpc('add_points_to_user', {
        user_id: user.id,
        points: 2
      });

      // Create notification for the recipient
      await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: 'friend_request',
          activity_data: { requester_id: user.id, requester_username: user.username },
          target_user_id: user.id,
          points_awarded: 0
        });

      setStatus(prev => ({ ...prev, pendingFriendRequest: 'sent' }));
      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  };

  const acceptFriendRequest = async () => {
    if (!user || !userId) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('requester_id', userId)
        .eq('addressee_id', user.id);

      if (error) throw error;

      // Award points for accepting friend request
      await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: 'friend_request_accepted_by_me',
          activity_data: { requester_id: userId },
          target_user_id: userId,
          points_awarded: 5
        });

      // Add points to user score
      await supabase.rpc('add_points_to_user', {
        user_id: user.id,
        points: 5
      });

      // Award points to requester for having request accepted
      await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: 'friend_request_accepted',
          activity_data: { accepter_username: user.username },
          target_user_id: user.id,
          points_awarded: 5
        });

      // Add points to requester's score
      await supabase.rpc('add_points_to_user', {
        user_id: userId,
        points: 5
      });

      setStatus(prev => ({ ...prev, isFriend: true, pendingFriendRequest: 'none' }));
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  };

  const rejectFriendRequest = async () => {
    if (!user || !userId) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', userId)
        .eq('addressee_id', user.id);

      if (error) throw error;

      setStatus(prev => ({ ...prev, pendingFriendRequest: 'none' }));
      return true;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      return false;
    }
  };

  const cancelFriendRequest = async () => {
    if (!user || !userId) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', user.id)
        .eq('addressee_id', userId);

      if (error) throw error;

      setStatus(prev => ({ ...prev, pendingFriendRequest: 'none' }));
      return true;
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      return false;
    }
  };

  const removeFriend = async () => {
    if (!user || !userId) return false;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
        .eq('status', 'accepted');

      if (error) throw error;

      setStatus(prev => ({ ...prev, isFriend: false }));
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  };

  const followUser = async () => {
    if (!user || !userId) return false;

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) throw error;

      // Create notification for being followed
      await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: 'new_follower',
          activity_data: { follower_id: user.id, follower_username: user.username },
          target_user_id: user.id,
          points_awarded: 0
        });

      setStatus(prev => ({ ...prev, isFollowing: true }));
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  };

  const unfollowUser = async () => {
    if (!user || !userId) return false;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      setStatus(prev => ({ ...prev, isFollowing: false }));
      return true;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  };

  return {
    ...status,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    followUser,
    unfollowUser
  };
};