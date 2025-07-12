-- Create pricing_plans table
CREATE TABLE public.pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing_plan_features table
CREATE TABLE public.pricing_plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  is_included BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pricing_plan_translations table
CREATE TABLE public.pricing_plan_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES pricing_plans(id) ON DELETE CASCADE,
  language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, language_id)
);

-- Create pricing_feature_translations table  
CREATE TABLE public.pricing_feature_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL,
  language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(feature_key, language_id)
);

-- Enable RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plan_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_feature_translations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view pricing plans" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Only admins can manage pricing plans" ON public.pricing_plans FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Everyone can view pricing plan features" ON public.pricing_plan_features FOR SELECT USING (true);
CREATE POLICY "Only admins can manage pricing plan features" ON public.pricing_plan_features FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Everyone can view pricing plan translations" ON public.pricing_plan_translations FOR SELECT USING (true);
CREATE POLICY "Only admins can manage pricing plan translations" ON public.pricing_plan_translations FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

CREATE POLICY "Everyone can view pricing feature translations" ON public.pricing_feature_translations FOR SELECT USING (true);
CREATE POLICY "Only admins can manage pricing feature translations" ON public.pricing_feature_translations FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Add triggers for updated_at
CREATE TRIGGER update_pricing_plans_updated_at
  BEFORE UPDATE ON public.pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_plan_translations_updated_at
  BEFORE UPDATE ON public.pricing_plan_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_feature_translations_updated_at
  BEFORE UPDATE ON public.pricing_feature_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default pricing plans
INSERT INTO public.pricing_plans (plan_key, name, price, description, display_order) VALUES
('free', 'Free', '$0', 'Perfect for getting started', 1),
('premium', 'Premium', '$9.99/month', 'Unlock your full potential', 2);

-- Insert default features for each plan
DO $$
DECLARE
  free_plan_id UUID;
  premium_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM pricing_plans WHERE plan_key = 'free';
  SELECT id INTO premium_plan_id FROM pricing_plans WHERE plan_key = 'premium';
  
  -- Free plan features
  INSERT INTO public.pricing_plan_features (plan_id, feature_key, display_order) VALUES
  (free_plan_id, 'posts_sharing', 1),
  (free_plan_id, 'community_access', 2),
  (free_plan_id, 'basic_progress_tracking', 3),
  (free_plan_id, 'library_access', 4),
  (free_plan_id, 'challenges_access', 5),
  (free_plan_id, 'training_sessions', 6);
  
  -- Premium plan features  
  INSERT INTO public.pricing_plan_features (plan_id, feature_key, display_order) VALUES
  (premium_plan_id, 'posts_sharing', 1),
  (premium_plan_id, 'community_access', 2),
  (premium_plan_id, 'advanced_progress_tracking', 3),
  (premium_plan_id, 'full_library_access', 4),
  (premium_plan_id, 'unlimited_challenges', 5),
  (premium_plan_id, 'custom_training_sessions', 6),
  (premium_plan_id, 'priority_support', 7),
  (premium_plan_id, 'exclusive_content', 8);
  
  -- Set free plan features as limited
  UPDATE public.pricing_plan_features SET is_included = false 
  WHERE plan_id = free_plan_id AND feature_key IN ('library_access', 'challenges_access', 'training_sessions');
END $$;

-- Insert English translations
INSERT INTO public.pricing_plan_translations (plan_id, language_id, name, description) 
SELECT id, 'en', name, description FROM pricing_plans;

-- Insert Polish translations
DO $$
DECLARE
  free_plan_id UUID;
  premium_plan_id UUID;
BEGIN
  SELECT id INTO free_plan_id FROM pricing_plans WHERE plan_key = 'free';
  SELECT id INTO premium_plan_id FROM pricing_plans WHERE plan_key = 'premium';
  
  INSERT INTO public.pricing_plan_translations (plan_id, language_id, name, description) VALUES
  (free_plan_id, 'pl', 'Darmowy', 'Idealny na początek'),
  (premium_plan_id, 'pl', 'Premium', 'Odblokuj swój pełny potencjał');
END $$;

-- Insert English feature translations
INSERT INTO public.pricing_feature_translations (feature_key, language_id, feature_text) VALUES
('posts_sharing', 'en', 'Share training posts'),
('community_access', 'en', 'Connect with community'),
('basic_progress_tracking', 'en', 'Basic progress tracking'),
('advanced_progress_tracking', 'en', 'Advanced progress analytics'),
('library_access', 'en', 'Limited library access'),
('full_library_access', 'en', 'Full library access'),
('challenges_access', 'en', 'Limited challenges'),
('unlimited_challenges', 'en', 'Unlimited challenges'),
('training_sessions', 'en', 'Basic training sessions'),
('custom_training_sessions', 'en', 'Custom training programs'),
('priority_support', 'en', 'Priority support'),
('exclusive_content', 'en', 'Exclusive content & features');

-- Insert Polish feature translations
INSERT INTO public.pricing_feature_translations (feature_key, language_id, feature_text) VALUES
('posts_sharing', 'pl', 'Udostępnianie postów treningowych'),
('community_access', 'pl', 'Dostęp do społeczności'),
('basic_progress_tracking', 'pl', 'Podstawowe śledzenie postępów'),
('advanced_progress_tracking', 'pl', 'Zaawansowane analizy postępów'),
('library_access', 'pl', 'Ograniczony dostęp do biblioteki'),
('full_library_access', 'pl', 'Pełny dostęp do biblioteki'),
('challenges_access', 'pl', 'Ograniczone wyzwania'),
('unlimited_challenges', 'pl', 'Nieograniczone wyzwania'),
('training_sessions', 'pl', 'Podstawowe sesje treningowe'),
('custom_training_sessions', 'pl', 'Spersonalizowane programy treningowe'),
('priority_support', 'pl', 'Priorytetowe wsparcie'),
('exclusive_content', 'pl', 'Ekskluzywne treści i funkcje');