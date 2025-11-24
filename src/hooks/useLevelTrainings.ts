import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LevelTraining {
  id: string;
  training_id: string;
  order_index: number;
  is_required: boolean;
  notes?: string;
  training: {
    id: string;
    title: string;
    thumbnail_url?: string;
    duration_seconds?: number;
    difficulty_level?: string;
    category: string;
    premium?: boolean;
  };
}

interface TrainingCompletion {
  training_id: string;
  completed_at: string;
  duration_seconds?: number;
}

export const useLevelTrainings = (sportLevelId?: string) => {
  const { user } = useAuth();
  const [levelTrainings, setLevelTrainings] = useState<LevelTraining[]>([]);
  const [completedTrainings, setCompletedTrainings] = useState<TrainingCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sportLevelId && user) {
      fetchLevelTrainings();
      fetchCompletedTrainings();
    }
  }, [sportLevelId, user]);

  const fetchLevelTrainings = async () => {
    if (!sportLevelId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("level_trainings")
        .select(`
          id,
          training_id,
          order_index,
          is_required,
          notes,
          training:training_library(
            id,
            title,
            thumbnail_url,
            duration_seconds,
            difficulty_level,
            category,
            premium
          )
        `)
        .eq("level_id", sportLevelId)
        .order("order_index");

      if (error) throw error;
      setLevelTrainings((data as any) || []);
    } catch (error) {
      console.error("Error fetching level trainings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompletedTrainings = async () => {
    if (!sportLevelId || !user) return;

    try {
      const { data, error } = await supabase
        .from("user_sport_level_training_completions")
        .select("training_id, completed_at, duration_seconds")
        .eq("sport_level_id", sportLevelId)
        .eq("user_id", user.id);

      if (error) throw error;
      setCompletedTrainings(data || []);
    } catch (error) {
      console.error("Error fetching completed trainings:", error);
    }
  };

  const isTrainingCompleted = (trainingId: string) => {
    return completedTrainings.some(ct => ct.training_id === trainingId);
  };

  const getCompletedCount = () => {
    return completedTrainings.length;
  };

  const getTotalCount = () => {
    return levelTrainings.length;
  };

  const refreshCompletions = async () => {
    await fetchCompletedTrainings();
  };

  return {
    levelTrainings,
    completedTrainings,
    isLoading,
    isTrainingCompleted,
    getCompletedCount,
    getTotalCount,
    refreshCompletions,
    refetch: fetchLevelTrainings,
  };
};
