-- Insert English and Polish content for all landing page sections
INSERT INTO landing_page_content (section_id, language_id, content_key, content_value) VALUES
-- Get section IDs first (assuming they exist from the previous migration)
-- Hero section content (English)
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'title', 'Master Your [gradient]Aerial[/gradient] Journey'),
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

-- Hero section content (Polish)
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'title', 'Opanuj Swoją [gradient]Powietrzną[/gradient] Podróż'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'subtitle', 'Połącz się z akrobatami powietrznymi na całym świecie, śledź swoje postępy i przekraczaj granice dzięki strukturalnym wyzwaniom i kompleksowej bibliotece pozycji.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'button_text', 'Rozpocznij Trening Za Darmo'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_1_value', '10K+'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_1_label', 'Aktywnych Sportowców'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_2_value', '500+'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_2_label', 'Figur Powietrznych'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_3_value', '50+'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_3_label', 'Wyzwań'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_4_value', '95%'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'stat_4_label', 'Wskaźnik Sukcesu'),

-- Features section content (English)
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'features_title', 'Everything You Need to [gradient]Excel[/gradient]'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'features_subtitle', 'From beginner-friendly tutorials to advanced challenge programs, we''ve got you covered at every stage of your aerial journey.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_1_title', 'Connect & Share'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_1_description', 'Follow other aerial athletes, share your progress, and get inspired by the community.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_2_title', 'Comprehensive Library'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_2_description', 'Access hundreds of aerial figures with detailed instructions and progressions.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_3_title', 'Take on Challenges'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_3_description', 'Join structured training programs and track your improvement over time.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_4_title', 'Track Progress'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'en', 'feature_4_description', 'Log your training sessions and see your aerial journey unfold.'),

-- Features section content (Polish)
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'features_title', 'Wszystko Czego Potrzebujesz do [gradient]Doskonalenia[/gradient]'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'features_subtitle', 'Od samouczków dla początkujących po zaawansowane programy wyzwań - mamy wszystko na każdym etapie Twojej powietrznej podróży.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_1_title', 'Łącz się i Dziel'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_1_description', 'Śledź innych akrobatów powietrznych, dziel się swoimi postępami i czerpij inspirację ze społeczności.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_2_title', 'Kompleksowa Biblioteka'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_2_description', 'Uzyskaj dostęp do setek figur powietrznych ze szczegółowymi instrukcjami i progresją.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_3_title', 'Podejmij Wyzwania'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_3_description', 'Dołącz do strukturalnych programów treningowych i śledź swoje postępy w czasie.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_4_title', 'Śledź Postępy'),
((SELECT id FROM landing_page_sections WHERE section_key = 'features'), 'pl', 'feature_4_description', 'Zapisuj swoje sesje treningowe i obserwuj rozwój swojej powietrznej podróży.'),

-- Pricing section content (English)
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'pricing_title', 'Choose Your [gradient]Training[/gradient] Plan'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'pricing_subtitle', 'Start free or unlock the full potential of your aerial journey with our premium features.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'free_plan_title', 'Free'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'free_plan_price', '$0'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'free_plan_description', 'Perfect for getting started'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'free_plan_button', 'Get Started Free'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'premium_plan_title', 'Premium'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'premium_plan_price', '$10'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'premium_plan_description', 'For serious aerial athletes'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'en', 'premium_plan_button', 'Start Premium Trial'),

-- Pricing section content (Polish)
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'pricing_title', 'Wybierz Swój Plan [gradient]Treningowy[/gradient]'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'pricing_subtitle', 'Rozpocznij za darmo lub odblokuj pełny potencjał swojej powietrznej podróży dzięki naszym funkcjom premium.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'free_plan_title', 'Darmowy'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'free_plan_price', '$0'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'free_plan_description', 'Idealny na początek'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'free_plan_button', 'Rozpocznij Za Darmo'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'premium_plan_title', 'Premium'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'premium_plan_price', '$10'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'premium_plan_description', 'Dla poważnych akrobatów powietrznych'),
((SELECT id FROM landing_page_sections WHERE section_key = 'pricing'), 'pl', 'premium_plan_button', 'Rozpocznij Próbę Premium'),

-- CTA section content (English)
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'en', 'cta_title', 'Ready to [gradient]Transform[/gradient] Your Training?'),
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'en', 'cta_subtitle', 'Join thousands of aerial athletes who are already using IguanaFlow to reach new heights in their practice.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'en', 'cta_button', 'Get Started Today'),

-- CTA section content (Polish)
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'pl', 'cta_title', 'Gotowy na [gradient]Transformację[/gradient] Swojego Treningu?'),
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'pl', 'cta_subtitle', 'Dołącz do tysięcy akrobatów powietrznych, którzy już używają IguanaFlow, aby osiągnąć nowe wysokości w swojej praktyce.'),
((SELECT id FROM landing_page_sections WHERE section_key = 'cta'), 'pl', 'cta_button', 'Rozpocznij Dzisiaj'),

-- Navigation content (English)
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'nav_sign_in', 'Sign In'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'nav_get_started', 'Get Started'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'en', 'nav_start', 'Start'),

-- Navigation content (Polish)
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'nav_sign_in', 'Zaloguj się'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'nav_get_started', 'Rozpocznij'),
((SELECT id FROM landing_page_sections WHERE section_key = 'hero'), 'pl', 'nav_start', 'Start')

ON CONFLICT (section_id, language_id, content_key) DO UPDATE SET
content_value = EXCLUDED.content_value,
updated_at = now();