import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLandingStats = () => {
  return useQuery({
    queryKey: ['landing-stats'],
    queryFn: async () => {
      const [profilesResult, figuresResult, challengesResult, completedResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('figures')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('challenges')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),
        supabase
          .from('challenge_participants')
          .select('id', { count: 'exact', head: true })
          .eq('completed', true),
      ]);

      const athletes = profilesResult.count || 500;
      const figures = figuresResult.count || 200;
      const challenges = challengesResult.count || 50;
      const completed = completedResult.count || 0;
      
      // Calculate success rate
      const successRate = athletes > 0 ? Math.round((completed / athletes) * 100) : 95;

      return {
        athletes: `${athletes}+`,
        figures: `${figures}+`,
        challenges: `${challenges}+`,
        successRate: `${Math.min(successRate, 95)}%`,
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000,
  });
};
