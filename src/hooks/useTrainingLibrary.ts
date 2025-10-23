import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrainingLibrary {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  category: 'warmup' | 'exercise' | 'cooldown' | 'complex';
  sport_type: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  tags: string[];
  training_type: 'video' | 'figure_set' | 'complex';
  video_url: string | null;
  duration_seconds: number;
  premium: boolean;
  is_published: boolean;
  views_count: number;
  completions_count: number;
  created_at: string;
}

interface UseTrainingLibraryFilters {
  category?: string[];
  sportType?: string[];
  difficulty?: string[];
  trainingType?: string[];
  premium?: boolean | null;
  search?: string;
}

export const useTrainingLibrary = (filters: UseTrainingLibraryFilters = {}) => {
  const [trainings, setTrainings] = useState<TrainingLibrary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('training_library')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      if (filters.sportType && filters.sportType.length > 0) {
        query = query.overlaps('sport_type', filters.sportType);
      }

      if (filters.difficulty && filters.difficulty.length > 0) {
        query = query.in('difficulty_level', filters.difficulty);
      }

      if (filters.trainingType && filters.trainingType.length > 0) {
        query = query.in('training_type', filters.trainingType);
      }

      if (filters.premium !== undefined && filters.premium !== null) {
        query = query.eq('premium', filters.premium);
      }

      if (filters.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setTrainings((data || []) as TrainingLibrary[]);
    } catch (err: any) {
      console.error('Error fetching trainings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, [
    filters.category?.join(','),
    filters.sportType?.join(','),
    filters.difficulty?.join(','),
    filters.trainingType?.join(','),
    filters.premium,
    filters.search,
  ]);

  return { trainings, isLoading, error, refetch: fetchTrainings };
};
