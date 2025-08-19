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
        .select('id, similar_figure_id')
        .eq('figure_id', exerciseId);

      if (error) throw error;

      // Get the full exercise data for each similar figure
      if (data && data.length > 0) {
        const figureIds = data.map(item => item.similar_figure_id);
        const { data: figuresData, error: figuresError } = await supabase
          .from('figures')
          .select(`
            id,
            name,
            description,
            difficulty_level,
            image_url,
            video_url,
            category,
            premium
          `)
          .in('id', figureIds);

        if (figuresError) throw figuresError;

        const formattedData = figuresData?.map((figure: any) => ({
          id: figure.id,
          name: figure.name,
          description: figure.description,
          difficulty_level: figure.difficulty_level,
          image_url: figure.image_url,
          video_url: figure.video_url,
          category: figure.category,
          premium: figure.premium,
        })) || [];

        setSimilarExercises(formattedData);
      } else {
        setSimilarExercises([]);
      }
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