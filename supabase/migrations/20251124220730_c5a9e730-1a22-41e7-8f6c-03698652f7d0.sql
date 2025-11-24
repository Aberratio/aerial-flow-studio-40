-- Create level_trainings table for assigning trainings to sport levels
CREATE TABLE IF NOT EXISTS public.level_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.sport_levels(id) ON DELETE CASCADE,
  training_id UUID NOT NULL REFERENCES public.training_library(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(level_id, training_id)
);

-- Create user_sport_level_training_completions table for tracking completed trainings in level context
CREATE TABLE IF NOT EXISTS public.user_sport_level_training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_level_id UUID NOT NULL REFERENCES public.sport_levels(id) ON DELETE CASCADE,
  training_id UUID NOT NULL REFERENCES public.training_library(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  notes TEXT,
  UNIQUE(user_id, sport_level_id, training_id)
);

-- Create sport_demo_users table for beta testers with demo access
CREATE TABLE IF NOT EXISTS public.sport_demo_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_category TEXT NOT NULL,
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(user_id, sport_category)
);

-- Enable RLS on new tables
ALTER TABLE public.level_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sport_level_training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_demo_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for level_trainings
CREATE POLICY "Everyone can view level trainings"
  ON public.level_trainings
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage level trainings"
  ON public.level_trainings
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'::user_role
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'::user_role
    )
  );

-- RLS Policies for user_sport_level_training_completions
CREATE POLICY "Users can view their own training completions"
  ON public.user_sport_level_training_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training completions"
  ON public.user_sport_level_training_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all training completions"
  ON public.user_sport_level_training_completions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'::user_role
    )
  );

-- RLS Policies for sport_demo_users
CREATE POLICY "Users can view their own demo access"
  ON public.sport_demo_users
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage demo users"
  ON public.sport_demo_users
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'::user_role
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'admin'::user_role
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_level_trainings_level_id ON public.level_trainings(level_id);
CREATE INDEX IF NOT EXISTS idx_level_trainings_training_id ON public.level_trainings(training_id);
CREATE INDEX IF NOT EXISTS idx_user_sport_level_training_completions_user_id ON public.user_sport_level_training_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sport_level_training_completions_level_id ON public.user_sport_level_training_completions(sport_level_id);
CREATE INDEX IF NOT EXISTS idx_sport_demo_users_user_id ON public.sport_demo_users(user_id);
CREATE INDEX IF NOT EXISTS idx_sport_demo_users_sport_category ON public.sport_demo_users(sport_category);