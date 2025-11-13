-- Reset wyzwania "28 Dni Planka: Stabilny Progres" z zachowaniem progresu dla Mehtap
-- Challenge ID: 26d319e5-49c8-4b30-a7e7-35c59d44b7e5
-- Mehtap user_id: f634903d-2deb-42a8-abf5-ed6c2451a104

-- KROK 1: Usunąć wszystkie stare wpisy progresu dla tego wyzwania
DELETE FROM challenge_day_progress 
WHERE challenge_id = '26d319e5-49c8-4b30-a7e7-35c59d44b7e5';

-- KROK 2: Zresetować wszystkich uczestników
UPDATE challenge_participants 
SET 
  last_completed_day = 0, 
  current_day_number = 1, 
  updated_at = now()
WHERE challenge_id = '26d319e5-49c8-4b30-a7e7-35c59d44b7e5';

-- KROK 3: Dodać progres dla Mehtap (dni 1-8)
INSERT INTO challenge_day_progress (
  user_id, 
  challenge_id, 
  training_day_id, 
  status, 
  exercises_completed, 
  total_exercises,
  attempt_number,
  created_at,
  updated_at,
  changed_status_at
) VALUES
-- Dzień 1: 2025-08-09
('f634903d-2deb-42a8-abf5-ed6c2451a104', '26d319e5-49c8-4b30-a7e7-35c59d44b7e5', 'b827ee94-9a19-4e4c-a7e0-6915f6f14baa', 'completed', 4, 4, 1, '2025-08-09 17:00:00+00', '2025-08-09 17:00:00+00', '2025-08-09 17:00:00+00'),
-- Dzień 2: 2025-08-10
('f634903d-2deb-42a8-abf5-ed6c2451a104', '26d319e5-49c8-4b30-a7e7-35c59d44b7e5', '9272885f-4eb5-4953-a80a-769416c05f29', 'completed', 4, 4, 1, '2025-08-10 17:00:00+00', '2025-08-10 17:00:00+00', '2025-08-10 17:00:00+00'),
-- Dzień 3: 2025-08-11
('f634903d-2deb-42a8-abf5-ed6c2451a104', '26d319e5-49c8-4b30-a7e7-35c59d44b7e5', '6baa4f72-4641-43ef-a9b7-cfce4a1c5f32', 'completed', 4, 4, 1, '2025-08-11 17:00:00+00', '2025-08-11 17:00:00+00', '2025-08-11 17:00:00+00'),
-- Dzień 4: 2025-08-12
('f634903d-2deb-42a8-abf5-ed6c2451a104', '26d319e5-49c8-4b30-a7e7-35c59d44b7e5', 'dc16c67d-e6fb-4f13-9140-e66c2cd57b64', 'completed', 4, 4, 1, '2025-08-12 17:00:00+00', '2025-08-12 17:00:00+00', '2025-08-12 17:00:00+00'),
-- Dzień 5: 2025-08-13
('f634903d-2deb-42a8-abf5-ed6c2451a104', '26d319e5-49c8-4b30-a7e7-35c59d44b7e5', '7be81cc9-7759-40ef-85a4-2aa96a0620de', 'completed', 4, 4, 1, '2025-08-13 17:00:00+00', '2025-08-13 17:00:00+00', '2025-08-13 17:00:00+00'),
-- Dzień 6: 2025-08-14
('f634903d-2deb-42a8-abf5-ed6c2451a104', '26d319e5-49c8-4b30-a7e7-35c59d44b7e5', '73cabeac-ce1d-4b8d-8e96-3ab61c154909', 'completed', 4, 4, 1, '2025-08-14 17:00:00+00', '2025-08-14 17:00:00+00', '2025-08-14 17:00:00+00'),
-- Dzień 7: 2025-08-15 (rest day - 0 exercises)
('f634903d-2deb-42a8-abf5-ed6c2451a104', '26d319e5-49c8-4b30-a7e7-35c59d44b7e5', 'eb39ac80-bf93-4887-ace3-849c7b2fd384', 'completed', 0, 0, 1, '2025-08-15 17:00:00+00', '2025-08-15 17:00:00+00', '2025-08-15 17:00:00+00'),
-- Dzień 8: 2025-08-16
('f634903d-2deb-42a8-abf5-ed6c2451a104', '26d319e5-49c8-4b30-a7e7-35c59d44b7e5', '9350f404-f854-4122-8df1-5df3c889d603', 'completed', 4, 4, 1, '2025-08-16 17:00:00+00', '2025-08-16 17:00:00+00', '2025-08-16 17:00:00+00');

-- KROK 4: Zaktualizować challenge_participants dla Mehtap
UPDATE challenge_participants 
SET 
  last_completed_day = 8, 
  current_day_number = 9, 
  updated_at = now()
WHERE 
  user_id = 'f634903d-2deb-42a8-abf5-ed6c2451a104'
  AND challenge_id = '26d319e5-49c8-4b30-a7e7-35c59d44b7e5';