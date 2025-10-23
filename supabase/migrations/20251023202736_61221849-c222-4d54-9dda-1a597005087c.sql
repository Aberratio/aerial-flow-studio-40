-- Create training_library table
CREATE TABLE public.training_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Categorization (FILTERS)
  category TEXT NOT NULL CHECK (category IN ('warmup', 'exercise', 'cooldown', 'complex')),
  sport_type TEXT[] DEFAULT '{}',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  
  -- Training type
  training_type TEXT NOT NULL CHECK (training_type IN ('video', 'figure_set', 'complex')),
  
  -- For video type
  video_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  
  -- Access
  premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  
  -- Meta
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Statistics
  views_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0
);

-- Create training_library_exercises table
CREATE TABLE public.training_library_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES training_library(id) ON DELETE CASCADE NOT NULL,
  figure_id UUID REFERENCES figures(id) NOT NULL,
  
  -- Order and settings
  order_index INTEGER NOT NULL,
  
  -- Completion mode
  completion_mode TEXT NOT NULL CHECK (completion_mode IN ('time', 'completion')),
  
  -- For TIME mode
  sets INTEGER DEFAULT 1,
  reps INTEGER DEFAULT 1,
  hold_time_seconds INTEGER DEFAULT 30,
  rest_time_seconds INTEGER DEFAULT 30,
  
  -- For COMPLETION mode
  target_completions INTEGER,
  
  -- Additional
  notes TEXT,
  audio_cue_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create training_library_compositions table
CREATE TABLE public.training_library_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_training_id UUID REFERENCES training_library(id) ON DELETE CASCADE NOT NULL,
  child_training_id UUID REFERENCES training_library(id) ON DELETE CASCADE NOT NULL,
  
  order_index INTEGER NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(parent_training_id, child_training_id)
);

-- Create user_training_progress table
CREATE TABLE public.user_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  training_id UUID REFERENCES training_library(id) NOT NULL,
  
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  
  -- For tracking progress in figure_set
  current_exercise_index INTEGER DEFAULT 0,
  completed_exercises JSONB DEFAULT '[]',
  
  started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, training_id)
);

-- Create user_training_bookmarks table
CREATE TABLE public.user_training_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  training_id UUID REFERENCES training_library(id) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, training_id)
);

-- Add updated_at trigger for training_library
CREATE TRIGGER update_training_library_updated_at
  BEFORE UPDATE ON public.training_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for user_training_progress
CREATE TRIGGER update_user_training_progress_updated_at
  BEFORE UPDATE ON public.user_training_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for training_library
ALTER TABLE public.training_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published trainings"
ON public.training_library FOR SELECT
USING (is_published = true);

CREATE POLICY "Trainers can view all trainings"
ON public.training_library FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('trainer', 'admin')
));

CREATE POLICY "Trainers can manage trainings"
ON public.training_library FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('trainer', 'admin')
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('trainer', 'admin')
));

-- RLS Policies for training_library_exercises
ALTER TABLE public.training_library_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published training exercises"
ON public.training_library_exercises FOR SELECT
USING (training_id IN (
  SELECT id FROM training_library WHERE is_published = true
));

CREATE POLICY "Trainers can manage training exercises"
ON public.training_library_exercises FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('trainer', 'admin')
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('trainer', 'admin')
));

-- RLS Policies for training_library_compositions
ALTER TABLE public.training_library_compositions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published compositions"
ON public.training_library_compositions FOR SELECT
USING (parent_training_id IN (
  SELECT id FROM training_library WHERE is_published = true
));

CREATE POLICY "Trainers can manage compositions"
ON public.training_library_compositions FOR ALL
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('trainer', 'admin')
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM profiles WHERE role IN ('trainer', 'admin')
));

-- RLS Policies for user_training_progress
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON public.user_training_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
ON public.user_training_progress FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_training_bookmarks
ALTER TABLE public.user_training_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
ON public.user_training_bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks"
ON public.user_training_bookmarks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_training_library_category ON public.training_library(category);
CREATE INDEX idx_training_library_sport_type ON public.training_library USING GIN(sport_type);
CREATE INDEX idx_training_library_difficulty ON public.training_library(difficulty_level);
CREATE INDEX idx_training_library_type ON public.training_library(training_type);
CREATE INDEX idx_training_library_published ON public.training_library(is_published);

CREATE INDEX idx_training_library_exercises_training ON public.training_library_exercises(training_id);
CREATE INDEX idx_training_library_exercises_figure ON public.training_library_exercises(figure_id);

CREATE INDEX idx_training_library_compositions_parent ON public.training_library_compositions(parent_training_id);
CREATE INDEX idx_training_library_compositions_child ON public.training_library_compositions(child_training_id);

CREATE INDEX idx_user_training_progress_user ON public.user_training_progress(user_id);
CREATE INDEX idx_user_training_progress_training ON public.user_training_progress(training_id);

CREATE INDEX idx_user_training_bookmarks_user ON public.user_training_bookmarks(user_id);
CREATE INDEX idx_user_training_bookmarks_training ON public.user_training_bookmarks(training_id);