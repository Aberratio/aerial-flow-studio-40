import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DifficultyLevel {
  key: string;
  name_pl: string;
  color_class: string;
  order_index: number;
}

interface FigureType {
  key: string;
  name_pl: string;
  order_index: number;
}

interface SportCategory {
  id: string;
  key_name: string;
  name: string;
  icon?: string;
  is_published: boolean;
}

interface DictionaryContextType {
  difficultyLevels: DifficultyLevel[];
  figureTypes: FigureType[];
  sportCategories: SportCategory[];
  isLoading: boolean;
  
  // Helper functions
  getDifficultyLabel: (key: string | null | undefined) => string;
  getDifficultyColor: (key: string | null | undefined) => string;
  getFigureTypeLabel: (key: string | null | undefined) => string;
  getSportCategoryLabel: (key: string | null | undefined) => string;
}

const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined);

export const DictionaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);
  const [figureTypes, setFigureTypes] = useState<FigureType[]>([]);
  const [sportCategories, setSportCategories] = useState<SportCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDictionaries = async () => {
      setIsLoading(true);
      
      const [difficultyRes, typesRes, categoriesRes] = await Promise.all([
        supabase.from('figure_difficulty_levels').select('*').order('order_index'),
        supabase.from('figure_types').select('*').order('order_index'),
        supabase.from('sport_categories').select('id, key_name, name, icon, is_published').eq('is_published', true),
      ]);

      if (difficultyRes.data) setDifficultyLevels(difficultyRes.data);
      if (typesRes.data) setFigureTypes(typesRes.data);
      if (categoriesRes.data) setSportCategories(categoriesRes.data);
      
      setIsLoading(false);
    };

    fetchDictionaries();
  }, []);

  const getDifficultyLabel = (key: string | null | undefined): string => {
    if (!key) return '';
    const level = difficultyLevels.find(d => d.key === key.toLowerCase());
    return level?.name_pl || key;
  };

  const getDifficultyColor = (key: string | null | undefined): string => {
    if (!key) return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    const level = difficultyLevels.find(d => d.key === key.toLowerCase());
    return level?.color_class || 'bg-gray-500/20 text-gray-400 border-gray-400/30';
  };

  const getFigureTypeLabel = (key: string | null | undefined): string => {
    if (!key) return '';
    const type = figureTypes.find(t => t.key === key);
    return type?.name_pl || key;
  };

  const getSportCategoryLabel = (key: string | null | undefined): string => {
    if (!key) return '';
    const category = sportCategories.find(c => c.key_name === key);
    return category?.name || key;
  };

  return (
    <DictionaryContext.Provider
      value={{
        difficultyLevels,
        figureTypes,
        sportCategories,
        isLoading,
        getDifficultyLabel,
        getDifficultyColor,
        getFigureTypeLabel,
        getSportCategoryLabel,
      }}
    >
      {children}
    </DictionaryContext.Provider>
  );
};

export const useDictionary = () => {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error('useDictionary must be used within DictionaryProvider');
  }
  return context;
};
