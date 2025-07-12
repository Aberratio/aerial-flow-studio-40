-- Create landing page content management tables

-- Landing page sections table
CREATE TABLE public.landing_page_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_type TEXT NOT NULL, -- 'hero', 'features', 'pricing', 'cta'
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Landing page content translations table
CREATE TABLE public.landing_page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES landing_page_sections(id) ON DELETE CASCADE,
  language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  content_key TEXT NOT NULL, -- 'title', 'subtitle', 'description', 'button_text', etc.
  content_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section_id, language_id, content_key)
);

-- Enable RLS
ALTER TABLE public.landing_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_page_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landing_page_sections
CREATE POLICY "Everyone can view landing page sections" 
ON public.landing_page_sections 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage landing page sections" 
ON public.landing_page_sections 
FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'::user_role
));

-- RLS Policies for landing_page_content
CREATE POLICY "Everyone can view landing page content" 
ON public.landing_page_content 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage landing page content" 
ON public.landing_page_content 
FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'::user_role
));

-- Insert default landing page sections
INSERT INTO public.landing_page_sections (section_key, section_type, display_order, image_url) VALUES
('hero', 'hero', 1, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop'),
('features', 'features', 2, null),
('pricing', 'pricing', 3, null),
('cta', 'cta', 4, null);

-- Insert default content for English
INSERT INTO public.landing_page_content (section_id, language_id, content_key, content_value) VALUES
-- Hero section
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'title', 'Master Your Aerial Journey'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'subtitle', 'Connect with aerial athletes worldwide, track your progress, and push your limits with structured challenges and a comprehensive pose library.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'button_text', 'Start Training Free'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'stat_1_value', '10K+'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'stat_1_label', 'Active Athletes'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'stat_2_value', '500+'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'stat_2_label', 'Aerial Figures'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'stat_3_value', '50+'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'stat_3_label', 'Challenges'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'stat_4_value', '95%'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'stat_4_label', 'Success Rate'),

-- Features section
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'title', 'Everything You Need to Excel'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'subtitle', 'From beginner-friendly tutorials to advanced challenge programs, we''ve got you covered at every stage of your aerial journey.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_1_title', 'Connect & Share'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_1_description', 'Follow other aerial athletes, share your progress, and get inspired by the community.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_2_title', 'Comprehensive Library'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_2_description', 'Access hundreds of aerial figures with detailed instructions and progressions.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_3_title', 'Take on Challenges'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_3_description', 'Join structured training programs and track your improvement over time.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_4_title', 'Track Progress'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_4_description', 'Log your training sessions and see your aerial journey unfold.'),

-- Pricing section
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'title', 'Choose Your Training Plan'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'subtitle', 'Start free or unlock the full potential of your aerial journey with our premium features.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'free_plan_title', 'Free'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'free_plan_price', '$0'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'free_plan_description', 'Perfect for getting started'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'premium_plan_title', 'Premium'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'premium_plan_price', '$10'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'premium_plan_description', 'For serious aerial athletes'),

-- CTA section
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'en', 'title', 'Ready to Transform Your Training?'),
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'en', 'subtitle', 'Join thousands of aerial athletes who are already using IguanaFlow to reach new heights in their practice.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'en', 'button_text', 'Get Started Today');

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_landing_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_landing_page_sections_updated_at
    BEFORE UPDATE ON public.landing_page_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_landing_page_updated_at();

CREATE TRIGGER update_landing_page_content_updated_at
    BEFORE UPDATE ON public.landing_page_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_landing_page_updated_at();