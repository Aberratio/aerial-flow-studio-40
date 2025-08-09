import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserActivity {
  id: string;
  activity_type: string;
  activity_data: any;
  target_user_id: string | null;
  points_awarded: number;
  created_at: string;
  is_read: boolean;
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
          .limit(50);

        if (activitiesError) {
          console.error('Error fetching user activities:', activitiesError);
          return;
        }

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

        setActivities(activitiesWithUsers.slice(0, 20));
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

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_activities')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      if (error) {
        console.error('Error marking activities as read:', error);
      } else {
        // Update local state to reflect the change immediately
        setActivities(prev => 
          prev.map(activity => ({ ...activity, is_read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking activities as read:', error);
    }
  }, [user]);

  return { activities, loading, markAllAsRead };
};