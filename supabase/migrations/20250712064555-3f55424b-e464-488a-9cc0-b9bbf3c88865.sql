-- Insert Polish translations for landing page content
INSERT INTO ui_strings (language_id, string_key, value, category) VALUES
-- Navigation
('pl', 'nav_sign_in', 'Zaloguj się', 'navigation'),
('pl', 'nav_get_started', 'Rozpocznij', 'navigation'),
('pl', 'nav_start', 'Start', 'navigation'),

-- Hero section
('pl', 'title', 'Opanuj Swoją', 'hero'),
('pl', 'title_highlight', 'Powietrzną', 'hero'),
('pl', 'title_end', 'Podróż', 'hero'),
('pl', 'subtitle', 'Połącz się z akrobatami powietrznymi na całym świecie, śledź swoje postępy i przekraczaj granice dzięki strukturalnym wyzwaniom i kompleksowej bibliotece pozycji.', 'hero'),
('pl', 'button_text', 'Rozpocznij Trening Za Darmo', 'hero'),
('pl', 'stat_1_value', '10K+', 'hero'),
('pl', 'stat_1_label', 'Aktywnych Sportowców', 'hero'),
('pl', 'stat_2_value', '500+', 'hero'),
('pl', 'stat_2_label', 'Figur Powietrznych', 'hero'),
('pl', 'stat_3_value', '50+', 'hero'),
('pl', 'stat_3_label', 'Wyzwań', 'hero'),
('pl', 'stat_4_value', '95%', 'hero'),
('pl', 'stat_4_label', 'Wskaźnik Sukcesu', 'hero')

ON CONFLICT (language_id, string_key) DO UPDATE SET
value = EXCLUDED.value,
updated_at = now();