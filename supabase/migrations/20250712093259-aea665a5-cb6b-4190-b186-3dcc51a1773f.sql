-- Create site_settings table for admin uploads
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  file_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage site settings
CREATE POLICY "Only admins can manage site settings" 
ON public.site_settings 
FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- Everyone can view site settings
CREATE POLICY "Everyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default logo setting
INSERT INTO public.site_settings (setting_key, setting_value) 
VALUES ('site_logo', null);