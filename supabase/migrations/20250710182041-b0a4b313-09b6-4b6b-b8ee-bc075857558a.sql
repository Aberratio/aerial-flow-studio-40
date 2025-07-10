-- Create user settings table for language preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language_preference TEXT NOT NULL DEFAULT 'en' REFERENCES public.languages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create UI strings table for translating interface elements
CREATE TABLE public.ui_strings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  string_key TEXT NOT NULL,
  language_id TEXT NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  category TEXT, -- tabs, alerts, buttons, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(string_key, language_id)
);

-- Create static pages table for admin-editable content
CREATE TABLE public.static_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_key TEXT NOT NULL, -- privacy-policy, terms-of-use, about-us
  language_id TEXT NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(page_key, language_id)
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_strings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ui_strings
CREATE POLICY "Everyone can view ui strings" 
ON public.ui_strings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage ui strings" 
ON public.ui_strings 
FOR ALL 
USING (auth.uid() IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.role = 'admin'::user_role 
));

-- RLS Policies for static_pages
CREATE POLICY "Everyone can view static pages" 
ON public.static_pages 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage static pages" 
ON public.static_pages 
FOR ALL 
USING (auth.uid() IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.role = 'admin'::user_role 
));

-- Create triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ui_strings_updated_at
BEFORE UPDATE ON public.ui_strings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_static_pages_updated_at
BEFORE UPDATE ON public.static_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();