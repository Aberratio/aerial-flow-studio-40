import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rule_type: string;
  rule_value: number;
  earned_at?: string;
}

export const useUserAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievements (
            id,
            name,
            description,
            icon,
            points,
            rule_type,
            rule_value
          )
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        id: item.achievements?.id || '',
        name: item.achievements?.name || '',
        description: item.achievements?.description || '',
        icon: item.achievements?.icon || '',
        points: item.achievements?.points || 0,
        rule_type: item.achievements?.rule_type || '',
        rule_value: item.achievements?.rule_value || 0,
        earned_at: item.earned_at,
      })) || [];

      setAchievements(formattedData);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAchievements();
  }, [user]);

  return {
    achievements,
    loading,
    fetchUserAchievements,
  };
};