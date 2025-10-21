-- ========================================
-- TŁUMACZENIE BAZY DANYCH NA POLSKI
-- ========================================

-- 1. ACHIEVEMENTS
UPDATE achievements SET 
  name = 'Pierwszy Post',
  description = 'Podzieliłeś się swoim pierwszym powietrznym momentem'
WHERE id = '2e2fb12f-1d65-40df-a09a-3c6180d5f442';

UPDATE achievements SET 
  name = 'Towarzyski Motyl',
  description = '100+ polubień pod jednym postem'
WHERE id = '9d2b70ee-e1c6-4be0-ad36-e9584f224f6e';

UPDATE achievements SET 
  name = 'Mistrz Elastyczności',
  description = 'Ukończono 5 figur'
WHERE id = 'b0de0115-c0d1-45a5-89ad-9e0a8f16f7d2';

UPDATE achievements SET 
  name = 'Oddany Trener',
  description = '10 figur ukończonych'
WHERE id = '573d1b5a-cea1-490d-87d8-84e566f651c8';

UPDATE achievements SET 
  name = 'Perfekcyjna Forma',
  description = 'Ukończono 20 figur'
WHERE id = 'f127f1e1-4b3e-4525-9ce4-c7f1e37904fb';

UPDATE achievements SET 
  name = 'Pionier Planki',
  description = 'Wytrzymałeś, zatrzęsłeś się, pokonałeś. Ta odznaka celebruje Twoją pierwszą pełną podróż core. Od zera do bohatera planki.'
WHERE id = 'cfb4b5f8-901d-47b9-a977-e7beb5ccb8e0';

UPDATE achievements SET 
  name = 'Tropiciel Planki',
  description = 'Pokonałeś każdy skręt, zakręt i drżenie. Ta odznaka oznacza Twój bezkompromisowy krok w twardsze pozycje, ostrzejszą formę i silniejsze dni. Nie tylko awansowałeś - opanowałeś podróż.'
WHERE id = '617304b8-31f7-4acd-923e-ac08f7973963';

-- 2. PRICING PLANS
UPDATE pricing_plans SET 
  name = 'Darmowy',
  description = 'Idealny na początek'
WHERE plan_key = 'free';

UPDATE pricing_plans SET 
  name = 'Premium',
  description = 'Uwolnij swój pełny potencjał'
WHERE plan_key = 'premium';

-- 3. SPORT CATEGORIES
UPDATE sport_categories SET 
  name = 'Koło powietrzne'
WHERE key_name = 'hoop';

UPDATE sport_categories SET 
  name = 'Taniec na rurze'
WHERE key_name = 'pole';

UPDATE sport_categories SET 
  name = 'Mięśnie brzucha'
WHERE key_name = 'core';

-- 4. SPORT LEVELS
UPDATE sport_levels SET 
  level_name = 'Początkujący'
WHERE id = '33638a10-1e10-4a18-939e-edcd6695143d';

UPDATE sport_levels SET 
  level_name = 'Zen Rdzenia'
WHERE id = '5c7ea9ff-94f9-444d-93ab-77a764ea986b';

UPDATE sport_levels SET 
  level_name = 'Pierwszy Lot'
WHERE id = '2d72c815-331e-4902-a841-c8033769caf6';

UPDATE sport_levels SET 
  level_name = 'Kroki Nieba'
WHERE id = '1abca28a-4b5d-4b8f-9c6f-bba53db50bbc';

UPDATE sport_levels SET 
  level_name = 'Odkrywca Powietrza'
WHERE id = '86bbede9-ff57-4003-87ef-d9f2031f1407';

UPDATE sport_levels SET 
  level_name = 'Tancerz Chmur'
WHERE id = 'a968c874-ab16-471e-87f9-6ab9590120f0';

UPDATE sport_levels SET 
  level_name = 'Okiełznywacz Grawitacji'
WHERE id = 'ec13a5e6-c0b5-402f-9145-eda93d90fef5';

UPDATE sport_levels SET 
  level_name = 'Mistrz Płynności'
WHERE id = '14d2f6d3-ff09-4b26-a52d-bcd8fc9075ed';

UPDATE sport_levels SET 
  level_name = 'Wirtuoz Powietrza'
WHERE id = '3e2fabe7-4306-4409-b0bc-d553b9741b53';

UPDATE sport_levels SET 
  level_name = 'Artysta Nieba'
WHERE id = '91768190-43f8-45e3-809f-7a83fdfa1aaf';

UPDATE sport_levels SET 
  level_name = 'Gwiazda Powietrza'
WHERE id = '4e8fa27d-8cc0-4fb4-949c-56c8f7db7ae0';

UPDATE sport_levels SET 
  level_name = 'Legenda Powietrza'
WHERE id = '86b06215-5b41-4456-aa09-8893b364df76';

UPDATE sport_levels SET 
  level_name = 'Artysta Nieba'
WHERE id = 'fb004368-5ca0-4ddb-a7ea-23a7cfc9fef3';

UPDATE sport_levels SET 
  level_name = 'Początkujący'
WHERE id = '662a04a2-4776-466d-a8c0-daa9fab862e8';

UPDATE sport_levels SET 
  level_name = 'Legenda Powietrza'
WHERE id = '669c1669-8e23-4130-8db7-a5d0b26835e4';

-- 5. CHALLENGES
UPDATE challenges SET 
  title = '28 dni mocy planki: Zacznij od zera',
  description = 'Wzmocnij swój rdzeń, jeden dzień na raz! To 28-dniowe wyzwanie planki zostało zaprojektowane, aby stopniowo budować Twoją wytrzymałość, poprawiać postawę i zwiększać ogólną stabilność. Każdego dnia czeka Cię nieco dłuższe utrzymanie lub nowa wariacja, aby zachować motywację i postępy. Czy jesteś gotowy na wyzwanie?'
WHERE id = '615fd26b-8ace-4d7e-bc99-d961bc1c61ad';

UPDATE challenges SET 
  title = '28 dni mocy planki: Awansuj wyżej',
  description = 'Przenieś swoje umiejętności planki na wyższy poziom! To 28-dniowe wyzwanie łączy różnorodność, zabawę i stały postęp, aby rozpalić Twój rdzeń pod każdym kątem. Z krótkimi, skupionymi sesjami i wbudowanymi dniami odpoczynku, zwiększysz siłę, stabilność i pewność siebie - wszystko w mniej niż 10 minut dziennie. Awansujmy, jedna planka na raz!'
WHERE id = '26d319e5-49c8-4b30-a7e7-35c59d44b7e5';

-- 6. CHALLENGE TRAINING DAYS (Challenge: 28 Days of Plank Power: Level Up)
UPDATE challenge_training_days SET 
  title = 'Start imprezy z planką',
  description = 'Wprowadzenie. Tylko Ty, Twoja mata i grawitacja.'
WHERE id = '36ab34e5-68e5-4964-8095-44a893e9bea2';

UPDATE challenge_training_days SET 
  title = 'Boczny wysiłek',
  description = 'Twoje mięśnie skośne grzecznie się witają.'
WHERE id = 'ac43d43e-404c-4f06-a451-249da2853f32';

UPDATE challenge_training_days SET 
  title = 'Odwróć to',
  description = 'Twarzą do sufitu, opanuj moment.'
WHERE id = '69f80a83-8b38-43d1-bebb-d82d82316ae8';

UPDATE challenge_training_days SET 
  title = 'Przebudzenie rdzenia',
  description = 'Więcej sekund, więcej wigoru.'
WHERE id = '2f9e2228-30bf-4a14-911d-c95c25d6f4f1';

UPDATE challenge_training_days SET 
  title = 'Chwyć i podarj',
  description = 'Ramiona stabilne, rdzeń w ogniu.'
WHERE id = '5cfcfc25-0a9b-4ac6-a6ce-e715302ad3ca';

UPDATE challenge_training_days SET 
  title = 'Blasku tyłu',
  description = 'Pośladki i ścięgna pod reflektorami.'
WHERE id = '564944ca-3f73-4989-9094-9a93324ed323';

UPDATE challenge_training_days SET 
  title = 'Odpoczywaj jak profesjonalista',
  description = 'Regeneracja to trening. Rób to dobrze.'
WHERE id = 'd7c71724-c7d5-4e32-b585-0bf42bb3cd8c';

UPDATE challenge_training_days SET 
  title = 'Planka Plus',
  description = 'Trochę dłużej, dużo mocniej.'
WHERE id = 'd8e6d26c-2c6d-48f6-b9f7-54feb5f59b40';

UPDATE challenge_training_days SET 
  title = 'Historia boczna',
  description = 'Równowaga, oddychaj i wyglądaj cool robiąc to.'
WHERE id = 'c0cf19cc-54d9-49b9-9445-aa29eee96b63';

UPDATE challenge_training_days SET 
  title = 'Królewskość odwrotna',
  description = 'Opanuj swój tron... nawet jeśli jest do góry nogami.'
WHERE id = '289f6051-89fb-4347-ac73-c0b89ddf3396';

UPDATE challenge_training_days SET 
  title = 'Środek tygodnia mięśni',
  description = 'Nowy ulubiony dzień Twojego rdzenia.'
WHERE id = 'afd06c2b-d477-453e-9a6d-a401814a80b6';

UPDATE challenge_training_days SET 
  title = 'Planka i podbij',
  description = 'Mata się Ciebie boi teraz.'
WHERE id = '65333506-b3b3-4693-b2e1-bf042ed4ba9c';

UPDATE challenge_training_days SET 
  title = 'Biodra na horyzoncie',
  description = 'Podnieś je wysoko, trzymaj dumnie.'
WHERE id = '57d00ead-f5ed-4007-92f3-244e1712d6b7';

UPDATE challenge_training_days SET 
  title = 'Tryb relaksu aktywowany',
  description = 'Kanapa, poznaj mistrza.'
WHERE id = '4dc1d45f-9aa6-408d-8fa2-cea299ab9a1d';

UPDATE challenge_training_days SET 
  title = 'Planka 2.0',
  description = 'Silniejsza forma, bardziej zuchwała postawa.'
WHERE id = '72e14589-a07c-467d-8e44-db9408801e65';

UPDATE challenge_training_days SET 
  title = 'Boczna misja najwyższa',
  description = 'Gra równowagi: poziom wyżej.'
WHERE id = '1d8f5e3d-44dd-4a9b-8b45-52d08afd3a24';

UPDATE challenge_training_days SET 
  title = 'Królewska odwrotność',
  description = 'Biodra wysoko, korona stabilnie.'
WHERE id = '284e2e71-392d-41ba-8c1f-cbcf3cf801df';

UPDATE challenge_training_days SET 
  title = 'Epickia skośna',
  description = 'Epicka przygoda Twoich bocznych mięśni.'
WHERE id = '00b4acb7-59b2-4e77-b80d-b189c979b340';

UPDATE challenge_training_days SET 
  title = 'Szef maty',
  description = 'Teraz rządzisz na tej podłodze.'
WHERE id = '15e13e16-637c-45e7-a9e2-4a7165cb2c41';

UPDATE challenge_training_days SET 
  title = 'Autostrady bioder',
  description = 'Prosta droga do chwały rdzenia.'
WHERE id = '4d79b80c-5097-4cc3-8a96-6c6e90ad096c';

UPDATE challenge_training_days SET 
  title = 'Pauza profesjonalisty',
  description = 'Mięśnie rosną podczas Netflixa.'
WHERE id = '97ee7791-2d79-475d-9781-118ba52ec479';

UPDATE challenge_training_days SET 
  title = 'Maraton rdzenia',
  description = 'To jest wytrzymałość... ze stylem.'
WHERE id = 'a0c5bc85-c268-416c-a2e3-530a0750a2d7';

UPDATE challenge_training_days SET 
  title = 'Boczna legenda',
  description = 'Będą mówić o tej równowadze na zawsze.'
WHERE id = 'e1297b88-219e-420f-b4f8-2dca8b767f8d';

UPDATE challenge_training_days SET 
  title = 'Rockstar odwrotny',
  description = 'Światła sceniczne na Twoich plecach.'
WHERE id = 'd73863e2-8601-4846-853c-f553af82a57c';

UPDATE challenge_training_days SET 
  title = 'Finał pełnego rdzenia',
  description = 'Każdy mięsień jest zaproszony.'
WHERE id = '848a0fac-44ca-4296-bc45-c88ae1066db0';

UPDATE challenge_training_days SET 
  title = 'Boczny show-stopper',
  description = 'Ukradnij show, jedna noga na raz.'
WHERE id = '90298e30-5d0d-4bbf-a40d-1261b5c5c375';

UPDATE challenge_training_days SET 
  title = 'Relaks zwycięstwa',
  description = 'Prawie to zrobiłeś. Czas się napinać... z kanapy.'
WHERE id = '899b95c3-c4a6-495f-a0f5-74ba4e151eba';

UPDATE challenge_training_days SET 
  title = 'Ukoronuj króla',
  description = 'Ostatnie pchnięcie przed okrążeniem zwycięstwa.'
WHERE id = '3ceb06be-3a7f-400f-9037-0abc3746ff59';

-- 7. GALLERY MEDIA - większość już po polsku lub nazwy własne, tylko dragon tail wymaga tłumaczenia
UPDATE gallery_media SET 
  title = 'Ogon smoka'
WHERE id = '9025cf14-63fd-448f-a757-6cf93126ac87';