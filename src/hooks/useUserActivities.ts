import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserActivity {
  id: string;
  activity_type: string;
  activity_data: any;
  target_user_id: string | null;
  points_awarded: number;
  created_at: string;
  target_user?: {
    username: string;
    avatar_url: string | null;
  };
}

export const useUserActivities = () => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        // Get regular activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (activitiesError) {
          console.error('Error fetching user activities:', activitiesError);
          return;
        }

        // Get friend requests received
        const { data: friendRequestsData, error: friendRequestsError } = await supabase
          .from('user_follows')
          .select(`
            id,
            created_at,
            follower_id,
            profiles!user_follows_follower_id_fkey (
              username,
              avatar_url
            )
          `)
          .eq('following_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (friendRequestsError) {
          console.error('Error fetching friend requests:', friendRequestsError);
        }

        // Convert friend requests to activity format
        const friendRequestActivities = (friendRequestsData || []).map(request => ({
          id: `friend_request_${request.id}`,
          activity_type: 'friend_request',
          activity_data: { request_id: request.id },
          target_user_id: request.follower_id,
          points_awarded: 0,
          created_at: request.created_at,
          target_user: {
            username: request.profiles?.username || '',
            avatar_url: request.profiles?.avatar_url || null
          }
        }));

        // Get target users data for regular activities
        const activitiesWithUsers = await Promise.all(
          (activitiesData || []).map(async (activity) => {
            if (activity.target_user_id) {
              const { data: userData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', activity.target_user_id)
                .single();
              
              return {
                ...activity,
                target_user: userData
              };
            }
            return activity;
          })
        );

        // Combine and sort all activities
        const allActivities = [...activitiesWithUsers, ...friendRequestActivities];
        allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setActivities(allActivities.slice(0, 20)); // Keep only the latest 20
      } catch (error) {
        console.error('Error fetching user activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to real-time activity updates
    const channel = supabase
      .channel('user-activities-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchActivities(); // Refetch activities when new ones are added
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { activities, loading, refetch: () => {} };
};