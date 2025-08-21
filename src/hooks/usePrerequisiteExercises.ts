import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PrerequisiteExercise {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: string | null;
  image_url: string | null;
  video_url: string | null;
  category: string | null;
  premium: boolean;
}

export const usePrerequisiteExercises = (exerciseId?: string) => {
  const [prerequisiteExercises, setPrerequisiteExercises] = useState<PrerequisiteExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrerequisiteExercises = async () => {
    if (!exerciseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('prerequisite_figures')
        .select('id, prerequisite_figure_id')
        .eq('figure_id', exerciseId);

      if (error) throw error;

      // Get the full exercise data for each prerequisite figure
      if (data && data.length > 0) {
        const figureIds = data.map(item => item.prerequisite_figure_id);
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

        setPrerequisiteExercises(formattedData);
      } else {
        setPrerequisiteExercises([]);
      }
    } catch (error) {
      console.error('Error fetching prerequisite exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPrerequisiteExercise = async (prerequisiteExerciseId: string) => {
    if (!exerciseId) return;

    try {
      const { error } = await supabase
        .from('prerequisite_figures')
        .insert({
          figure_id: exerciseId,
          prerequisite_figure_id: prerequisiteExerciseId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;

      // Refresh the list
      await fetchPrerequisiteExercises();
    } catch (error) {
      console.error('Error adding prerequisite exercise:', error);
      throw error;
    }
  };

  const removePrerequisiteExercise = async (prerequisiteExerciseId: string) => {
    if (!exerciseId) return;

    try {
      const { error } = await supabase
        .from('prerequisite_figures')
        .delete()
        .eq('figure_id', exerciseId)
        .eq('prerequisite_figure_id', prerequisiteExerciseId);

      if (error) throw error;

      // Refresh the list
      await fetchPrerequisiteExercises();
    } catch (error) {
      console.error('Error removing prerequisite exercise:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPrerequisiteExercises();
  }, [exerciseId]);

  return {
    prerequisiteExercises,
    loading,
    fetchPrerequisiteExercises,
    addPrerequisiteExercise,
    removePrerequisiteExercise,
  };
};