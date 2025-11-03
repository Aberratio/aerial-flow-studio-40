/**
 * @deprecated Use data from DictionaryContext instead
 */
export const DIFFICULTY_LEVELS = {
  beginner: "Początkujący",
  intermediate: "Średni",
  advanced: "Zaawansowany",
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY_LEVELS;

/**
 * @deprecated Use data from DictionaryContext instead
 */
export const FIGURE_TYPES = {
  single_figure: "Pojedyncza figura",
  combo: "Kombo",
  warm_up: "Rozgrzewka",
  stretching: "Rozciąganie",
  transitions: "Przejścia", // NEW
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

// Figure interface with transition support
export interface Figure {
  id: string;
  name: string;
  description?: string;
  difficulty_level?: string;
  category?: string;
  type?: string;
  image_url?: string;
  video_url?: string;
  audio_url?: string; // NEW - audio instructions for any figure
  instructions?: string;
  tags?: string[];
  synonyms?: string[];
  premium?: boolean;
  hold_time_seconds?: number;
  sport_category_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  
  // Transitions-specific fields (only for type === 'transitions')
  transition_from_figure_id?: string;
  transition_to_figure_id?: string;
  transition_from_figure?: Figure; // Joined data
  transition_to_figure?: Figure;   // Joined data
}
