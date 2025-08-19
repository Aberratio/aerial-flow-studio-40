import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SimilarExercise {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: string | null;
  image_url: string | null;
  video_url: string | null;
  category: string | null;
  premium: boolean;
}

export const useSimilarExercises = (exerciseId?: string) => {
  const [similarExercises, setSimilarExercises] = useState<SimilarExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSimilarExercises = async () => {
    if (!exerciseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('similar_figures')
        .select(`
          id,
          similar_figure_id,
          figures!similar_figures_similar_figure_id_fkey (
            id,
            name,
            description,
            difficulty_level,
            image_url,
            video_url,
            category,
            premium
          )
        `)
        .eq('figure_id', exerciseId);

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        id: item.figures?.id || '',
        name: item.figures?.name || '',
        description: item.figures?.description || null,
        difficulty_level: item.figures?.difficulty_level || null,
        image_url: item.figures?.image_url || null,
        video_url: item.figures?.video_url || null,
        category: item.figures?.category || null,
        premium: item.figures?.premium || false,
      })) || [];

      setSimilarExercises(formattedData);
    } catch (error) {
      console.error('Error fetching similar exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSimilarExercise = async (similarExerciseId: string) => {
    if (!exerciseId) return;

    try {
      const { error } = await supabase
        .from('similar_figures')
        .insert({
          figure_id: exerciseId,
          similar_figure_id: similarExerciseId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      // Refresh the list
      await fetchSimilarExercises();
    } catch (error) {
      console.error('Error adding similar exercise:', error);
      throw error;
    }
  };

  const removeSimilarExercise = async (similarExerciseId: string) => {
    if (!exerciseId) return;

    try {
      const { error } = await supabase
        .from('similar_figures')
        .delete()
        .eq('figure_id', exerciseId)
        .eq('similar_figure_id', similarExerciseId);

      if (error) throw error;

      // Refresh the list
      await fetchSimilarExercises();
    } catch (error) {
      console.error('Error removing similar exercise:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSimilarExercises();
  }, [exerciseId]);

  return {
    similarExercises,
    loading,
    fetchSimilarExercises,
    addSimilarExercise,
    removeSimilarExercise,
  };
};