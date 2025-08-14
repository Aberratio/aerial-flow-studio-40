-- Add the abs challenges section to the landing page sections
INSERT INTO public.landing_page_sections (section_key, section_type, display_order, is_active, image_url)
VALUES ('abs_challenges', 'challenges', 3, true, NULL)
ON CONFLICT (section_key) DO NOTHING;