-- Add gallery section to landing page sections
INSERT INTO public.landing_page_sections (section_key, section_type, display_order, is_active)
VALUES ('gallery', 'gallery', 3, true)
ON CONFLICT (section_key) DO NOTHING;

-- Create a new table for gallery media items
CREATE TABLE IF NOT EXISTS public.gallery_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;

-- Create policies for gallery media
CREATE POLICY "Everyone can view active gallery media"
ON public.gallery_media
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only admins can manage gallery media"
ON public.gallery_media
FOR ALL
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role = 'admin'
))
WITH CHECK (auth.uid() IN (
  SELECT id FROM public.profiles WHERE role = 'admin'
));

-- Create trigger for updated_at
CREATE TRIGGER update_gallery_media_updated_at
BEFORE UPDATE ON public.gallery_media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();