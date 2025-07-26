import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rule_type: string;
  rule_value: number;
}

export const useAchievementChecker = () => {
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const { user } = useAuth();

  const checkChallengeCompletionAchievements = async (challengeId: string) => {
    if (!user) return;

    try {
      // Get achievements associated with this challenge
      const { data: challengeAchievements, error: challengeAchievementsError } = await supabase
        .from('challenge_achievements')
        .select(`
          achievement_id,
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
        .eq('challenge_id', challengeId);

      if (challengeAchievementsError) throw challengeAchievementsError;

      if (!challengeAchievements || challengeAchievements.length === 0) {
        return; // No achievements to check
      }

      // Check each achievement
      for (const challengeAchievement of challengeAchievements) {
        const achievement = challengeAchievement.achievements;
        if (!achievement || achievement.rule_type !== 'challenges_completed') continue;

        // Check if user already has this achievement
        const { data: existingAchievement, error: existingError } = await supabase
          .from('user_achievements')
          .select('id')
          .eq('user_id', user.id)
          .eq('achievement_id', achievement.id)
          .single();

        if (existingError && existingError.code !== 'PGRST116') {
          console.error('Error checking existing achievement:', existingError);
          continue;
        }

        // If user doesn't have this achievement, check if they've completed enough challenges
        if (!existingAchievement) {
          // Count completed challenges for this user
          const { data: completedChallenges, error: countError } = await supabase
            .from('challenge_participants')
            .select('challenge_id')
            .eq('user_id', user.id)
            .eq('completed', true);

          if (countError) {
            console.error('Error counting completed challenges:', countError);
            continue;
          }

          const completedCount = completedChallenges?.length || 0;

          // Check if user has completed enough challenges for this achievement
          if (completedCount >= achievement.rule_value) {
            // Award the achievement
            const { error: awardError } = await supabase
              .from('user_achievements')
              .insert({
                user_id: user.id,
                achievement_id: achievement.id
              });

            if (awardError) {
              console.error('Error awarding achievement:', awardError);
              continue;
            }

            // Add points to user
            const { error: pointsError } = await supabase
              .rpc('add_points_to_user', {
                user_id: user.id,
                points: achievement.points
              });

            if (pointsError) {
              console.error('Error adding points:', pointsError);
            }

            // Show achievement modal
            setNewAchievement(achievement);
            setShowAchievementModal(true);
            
            // Only show one achievement at a time
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error checking challenge completion achievements:', error);
    }
  };

  const closeAchievementModal = () => {
    setShowAchievementModal(false);
    setNewAchievement(null);
  };

  return {
    checkChallengeCompletionAchievements,
    newAchievement,
    showAchievementModal,
    closeAchievementModal
  };
};