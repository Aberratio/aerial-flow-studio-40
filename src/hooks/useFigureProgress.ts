import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FigureWithProgress {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: string | null;
  image_url: string | null;
  video_url: string | null;
  category: string | null;
  status: string;
  updated_at: string;
}

export const useFigureProgress = () => {
  const [figureProgress, setFigureProgress] = useState<FigureWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFigureProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('figure_progress')
        .select(`
          status,
          updated_at,
          figures (
            id,
            name,
            description,
            difficulty_level,
            image_url,
            video_url,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        id: item.figures?.id || '',
        name: item.figures?.name || '',
        description: item.figures?.description || null,
        difficulty_level: item.figures?.difficulty_level || null,
        image_url: item.figures?.image_url || null,
        video_url: item.figures?.video_url || null,
        category: item.figures?.category || null,
        status: item.status,
        updated_at: item.updated_at,
      })) || [];

      setFigureProgress(formattedData);
    } catch (error) {
      console.error('Error fetching figure progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFiguresByStatus = (status: string) => {
    return figureProgress.filter(figure => figure.status === status);
  };

  useEffect(() => {
    fetchFigureProgress();
  }, [user]);

  return {
    figureProgress,
    loading,
    fetchFigureProgress,
    getFiguresByStatus,
  };
};