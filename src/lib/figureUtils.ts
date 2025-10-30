import { DIFFICULTY_LEVELS, FIGURE_TYPES, type SportCategory, type DifficultyKey, type FigureTypeKey } from '@/types/figures';

/**
 * Get Polish label for difficulty level
 */
export const getDifficultyLabel = (key: string | null | undefined): string => {
  if (!key) return '';
  return DIFFICULTY_LEVELS[key as DifficultyKey] || key;
};

/**
 * Get Polish label for figure type
 */
export const getFigureTypeLabel = (key: string | null | undefined): string => {
  if (!key) return '';
  return FIGURE_TYPES[key as FigureTypeKey] || key;
};

/**
 * Get Polish label for category from sport categories
 */
export const getCategoryLabel = (categoryKey: string | null | undefined, categories: SportCategory[]): string => {
  if (!categoryKey) return '';
  const category = categories.find(c => c.key_name === categoryKey);
  return category?.name || categoryKey;
};

/**
 * Get difficulty color class for badges
 */
export const getDifficultyColorClass = (key: string | null | undefined): string => {
  if (!key) return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
  
  const colorMap: Record<string, string> = {
    beginner: 'bg-green-500/20 text-green-400 border-green-400/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30',
    advanced: 'bg-red-500/20 text-red-400 border-red-400/30'
  };
  
  return colorMap[key] || 'bg-gray-500/20 text-gray-400 border-gray-400/30';
};
