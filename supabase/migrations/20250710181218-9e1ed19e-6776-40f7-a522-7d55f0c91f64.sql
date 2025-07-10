-- Create translations system for multilingual support

-- Create languages table
CREATE TABLE public.languages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default languages
INSERT INTO public.languages (id, name, native_name, is_default) VALUES
('en', 'English', 'English', true),
('pl', 'Polish', 'Polski', false);

-- Create figure translations table
CREATE TABLE public.figure_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  figure_id UUID NOT NULL REFERENCES public.figures(id) ON DELETE CASCADE,
  language_id TEXT NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(figure_id, language_id)
);

-- Enable Row Level Security
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.figure_translations ENABLE ROW LEVEL SECURITY;

-- Create policies for languages table
CREATE POLICY "Everyone can view languages" 
ON public.languages 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage languages" 
ON public.languages 
FOR ALL 
USING (auth.uid() IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.role = 'admin'::user_role 
));

-- Create policies for figure_translations table
CREATE POLICY "Everyone can view figure translations" 
ON public.figure_translations 
FOR SELECT 
USING (true);

CREATE POLICY "Trainers can create figure translations" 
ON public.figure_translations 
FOR INSERT 
WITH CHECK (auth.uid() IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role]) 
));

CREATE POLICY "Trainers can update their own figure translations" 
ON public.figure_translations 
FOR UPDATE 
USING (
  figure_id IN (
    SELECT id FROM public.figures 
    WHERE created_by = auth.uid()
  ) AND auth.uid() IN ( 
    SELECT profiles.id FROM profiles 
    WHERE profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role]) 
  )
);

CREATE POLICY "Admins can update any figure translations" 
ON public.figure_translations 
FOR UPDATE 
USING (auth.uid() IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.role = 'admin'::user_role 
));

CREATE POLICY "Trainers can delete their own figure translations" 
ON public.figure_translations 
FOR DELETE 
USING (
  figure_id IN (
    SELECT id FROM public.figures 
    WHERE created_by = auth.uid()
  ) AND auth.uid() IN ( 
    SELECT profiles.id FROM profiles 
    WHERE profiles.role = ANY (ARRAY['trainer'::user_role, 'admin'::user_role]) 
  )
);

CREATE POLICY "Admins can delete any figure translations" 
ON public.figure_translations 
FOR DELETE 
USING (auth.uid() IN ( 
  SELECT profiles.id FROM profiles 
  WHERE profiles.role = 'admin'::user_role 
));

-- Create triggers for updated_at
CREATE TRIGGER update_languages_updated_at
BEFORE UPDATE ON public.languages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_figure_translations_updated_at
BEFORE UPDATE ON public.figure_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();