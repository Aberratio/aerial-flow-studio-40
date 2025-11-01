// Figure difficulty levels with Polish translations
export const DIFFICULTY_LEVELS = {
  beginner: "Początkujący",
  intermediate: "Średni",
  advanced: "Zaawansowany",
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY_LEVELS;

// Figure types with Polish translations
export const FIGURE_TYPES = {
  single_figure: "Pojedyncza figura",
  combo: "Kombo",
  warm_up: "Rozgrzewka",
  stretching: "Rozciąganie",
} as const;

export type FigureTypeKey = keyof typeof FIGURE_TYPES;

// Sport categories will be fetched from database
export interface SportCategory {
  id: string;
  key_name: string;
  name: string;
  description?: string;
  icon?: string;
  is_published: boolean;
}
