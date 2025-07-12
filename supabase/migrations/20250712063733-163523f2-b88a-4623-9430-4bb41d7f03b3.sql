-- Add Polish language if it doesn't exist
INSERT INTO public.languages (id, name, native_name, is_default) 
VALUES ('pl', 'Polish', 'Polski', false)
ON CONFLICT (id) DO NOTHING;

-- Insert Polish translations for landing page content
INSERT INTO public.landing_page_content (section_id, language_id, content_key, content_value) VALUES
-- Hero section - Polish
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'title', 'Opanuj Swoją Podróż Powietrzną'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'subtitle', 'Połącz się z gimnastykami powietrznymi na całym świecie, śledź swoje postępy i przekraczaj swoje granice dzięki strukturalnym wyzwaniom i kompleksowej bibliotece pozycji.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'button_text', 'Rozpocznij Darmowy Trening'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_1_value', '10K+'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_1_label', 'Aktywni Sportowcy'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_2_value', '500+'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_2_label', 'Figury Powietrzne'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_3_value', '50+'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_3_label', 'Wyzwania'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_4_value', '95%'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_4_label', 'Wskaźnik Sukcesu'),

-- Features section - Polish
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'title', 'Wszystko Czego Potrzebujesz do Doskonałości'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'subtitle', 'Od samouczków dla początkujących po zaawansowane programy wyzwań, mamy wszystko czego potrzebujesz na każdym etapie Twojej powietrznej podróży.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_1_title', 'Łącz się i Dziel'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_1_description', 'Śledź innych gimnastyków powietrznych, dziel się swoimi postępami i inspiruj się społecznością.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_2_title', 'Kompleksowa Biblioteka'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_2_description', 'Uzyskaj dostęp do setek figur powietrznych ze szczegółowymi instrukcjami i progresją.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_3_title', 'Podejmij Wyzwania'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_3_description', 'Dołącz do strukturalnych programów treningowych i śledź swoje postępy w czasie.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_4_title', 'Śledź Postępy'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_4_description', 'Rejestruj swoje sesje treningowe i obserwuj jak rozwija się Twoja powietrzna podróż.'),

-- Pricing section - Polish
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'title', 'Wybierz Swój Plan Treningowy'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'subtitle', 'Zacznij za darmo lub odblokuj pełny potencjał swojej powietrznej podróży dzięki naszym funkcjom premium.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'free_plan_title', 'Darmowy'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'free_plan_price', '0 zł'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'free_plan_description', 'Idealny na początek'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'premium_plan_title', 'Premium'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'premium_plan_price', '40 zł'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'premium_plan_description', 'Dla poważnych gimnastyków powietrznych'),

-- CTA section - Polish
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'pl', 'title', 'Gotowy na Transformację Swojego Treningu?'),
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'pl', 'subtitle', 'Dołącz do tysięcy gimnastyków powietrznych, którzy już używają IguanaFlow do osiągania nowych wysokości w swojej praktyce.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'pl', 'button_text', 'Zacznij Dzisiaj');