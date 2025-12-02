import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserChallenge {
  id: string;
  title: string;
  image_url: string | null;
  difficulty_level: string | null;
  status: 'active' | 'completed';
  current_day: number;
  total_days: number;
  progress_percent: number;
  joined_at: string;
}

export const useUserChallenges = (userId: string, canView: boolean) => {
  const [challenges, setChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !canView) {
      setChallenges([]);
      return;
    }

    const fetchChallenges = async () => {
      setLoading(true);
      try {
        // Fetch challenge participants with challenge details
        const { data: participants, error: participantsError } = await supabase
          .from('challenge_participants')
          .select(`
            challenge_id,
            status,
            current_day_number,
            last_completed_day,
            completed,
            joined_at,
            challenges (
              id,
              title,
              image_url,
              difficulty_level,
              status
            )
          `)
          .eq('user_id', userId)
          .order('joined_at', { ascending: false });

        if (participantsError) throw participantsError;

        // Filter only published challenges and get total days for each
        const challengesWithProgress = await Promise.all(
          (participants || [])
            .filter((p: any) => p.challenges?.status === 'published')
            .map(async (participant: any) => {
              // Get total days count
              const { count: totalDays } = await supabase
                .from('challenge_training_days')
                .select('*', { count: 'exact', head: true })
                .eq('challenge_id', participant.challenge_id);

              const currentDay = participant.last_completed_day || 0;
              const total = totalDays || 1;
              const progressPercent = Math.round((currentDay / total) * 100);

              return {
                id: participant.challenge_id,
                title: participant.challenges.title,
                image_url: participant.challenges.image_url,
                difficulty_level: participant.challenges.difficulty_level,
                status: participant.completed ? 'completed' : 'active',
                current_day: currentDay,
                total_days: total,
                progress_percent: Math.min(progressPercent, 100),
                joined_at: participant.joined_at,
              } as UserChallenge;
            })
        );

        // Sort: active first, then by joined_at
        challengesWithProgress.sort((a, b) => {
          if (a.status === 'active' && b.status !== 'active') return -1;
          if (a.status !== 'active' && b.status === 'active') return 1;
          return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
        });

        setChallenges(challengesWithProgress);
      } catch (error) {
        console.error('Error fetching user challenges:', error);
        setChallenges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [userId, canView]);

  return { challenges, loading };
};
