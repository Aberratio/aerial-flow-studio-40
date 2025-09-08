-- Create training system tables for admin management

-- Training courses table
CREATE TABLE public.training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Training lessons table  
CREATE TABLE public.training_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER DEFAULT 0,
  lesson_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Training videos table for lesson content
CREATE TABLE public.training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  video_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User progress tracking for courses
CREATE TABLE public.training_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.training_lessons(id) ON DELETE CASCADE,
  video_id UUID REFERENCES public.training_videos(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id, lesson_id, video_id)
);

-- Enable RLS on all tables
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_user_progress ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at
CREATE TRIGGER update_training_courses_updated_at
  BEFORE UPDATE ON public.training_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_lessons_updated_at
  BEFORE UPDATE ON public.training_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_videos_updated_at
  BEFORE UPDATE ON public.training_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_user_progress_updated_at
  BEFORE UPDATE ON public.training_user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for training_courses
CREATE POLICY "Admins can manage all training courses"
ON public.training_courses
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view published training courses"
ON public.training_courses
FOR SELECT
USING (is_published = true);

-- RLS Policies for training_lessons
CREATE POLICY "Admins can manage all training lessons"
ON public.training_lessons
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view published training lessons"
ON public.training_lessons
FOR SELECT
USING (is_published = true AND course_id IN (
  SELECT id FROM public.training_courses WHERE is_published = true
));

-- RLS Policies for training_videos
CREATE POLICY "Admins can manage all training videos"
ON public.training_videos
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view published training videos"
ON public.training_videos
FOR SELECT
USING (lesson_id IN (
  SELECT l.id FROM public.training_lessons l
  JOIN public.training_courses c ON c.id = l.course_id
  WHERE l.is_published = true AND c.is_published = true
));

-- RLS Policies for training_user_progress
CREATE POLICY "Users can manage their own training progress"
ON public.training_user_progress
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all training progress"
ON public.training_user_progress
FOR SELECT
USING (public.get_current_user_role() = 'admin');

-- Create indexes for better performance
CREATE INDEX idx_training_lessons_course_id ON public.training_lessons(course_id);
CREATE INDEX idx_training_lessons_order ON public.training_lessons(course_id, lesson_order);
CREATE INDEX idx_training_videos_lesson_id ON public.training_videos(lesson_id);
CREATE INDEX idx_training_videos_order ON public.training_videos(lesson_id, video_order);
CREATE INDEX idx_training_user_progress_user_course ON public.training_user_progress(user_id, course_id);
CREATE INDEX idx_training_user_progress_course ON public.training_user_progress(course_id);