import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserScore = () => {
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setScore(0);
      setLoading(false);
      return;
    }

    const fetchScore = async () => {
      try {
        const { data, error } = await supabase
          .from('user_scores')
          .select('total_points')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user score:', error);
          return;
        }

        setScore(data?.total_points || 0);
      } catch (error) {
        console.error('Error fetching user score:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScore();

    // Subscribe to real-time score updates
    const channel = supabase
      .channel('user-score-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_scores',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'total_points' in payload.new) {
            setScore(payload.new.total_points as number);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { score, loading };
};