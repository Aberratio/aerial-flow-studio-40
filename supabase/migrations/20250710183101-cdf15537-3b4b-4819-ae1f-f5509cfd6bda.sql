-- Populate UI strings with common app strings
INSERT INTO public.ui_strings (string_key, language_id, value, category) VALUES
-- Navigation
('nav.feed', 'en', 'Feed', 'navigation'),
('nav.feed', 'pl', 'Aktualności', 'navigation'),
('nav.library', 'en', 'Library', 'navigation'),
('nav.library', 'pl', 'Biblioteka', 'navigation'),
('nav.challenges', 'en', 'Challenges', 'navigation'),
('nav.challenges', 'pl', 'Wyzwania', 'navigation'),
('nav.training', 'en', 'Training', 'navigation'),
('nav.training', 'pl', 'Trening', 'navigation'),
('nav.profile', 'en', 'Profile', 'navigation'),
('nav.profile', 'pl', 'Profil', 'navigation'),
('nav.friends', 'en', 'Friends', 'navigation'),
('nav.friends', 'pl', 'Znajomi', 'navigation'),
('nav.inbox', 'en', 'Inbox', 'navigation'),
('nav.inbox', 'pl', 'Skrzynka', 'navigation'),

-- Buttons
('button.save', 'en', 'Save', 'buttons'),
('button.save', 'pl', 'Zapisz', 'buttons'),
('button.cancel', 'en', 'Cancel', 'buttons'),
('button.cancel', 'pl', 'Anuluj', 'buttons'),
('button.delete', 'en', 'Delete', 'buttons'),
('button.delete', 'pl', 'Usuń', 'buttons'),
('button.edit', 'en', 'Edit', 'buttons'),
('button.edit', 'pl', 'Edytuj', 'buttons'),
('button.create', 'en', 'Create', 'buttons'),
('button.create', 'pl', 'Utwórz', 'buttons'),
('button.add', 'en', 'Add', 'buttons'),
('button.add', 'pl', 'Dodaj', 'buttons'),
('button.share', 'en', 'Share', 'buttons'),
('button.share', 'pl', 'Udostępnij', 'buttons'),
('button.like', 'en', 'Like', 'buttons'),
('button.like', 'pl', 'Polub', 'buttons'),
('button.comment', 'en', 'Comment', 'buttons'),
('button.comment', 'pl', 'Komentarz', 'buttons'),
('button.follow', 'en', 'Follow', 'buttons'),
('button.follow', 'pl', 'Obserwuj', 'buttons'),
('button.unfollow', 'en', 'Unfollow', 'buttons'),
('button.unfollow', 'pl', 'Przestań obserwować', 'buttons'),
('button.logout', 'en', 'Logout', 'buttons'),
('button.logout', 'pl', 'Wyloguj', 'buttons'),
('button.login', 'en', 'Login', 'buttons'),
('button.login', 'pl', 'Zaloguj', 'buttons'),
('button.register', 'en', 'Register', 'buttons'),
('button.register', 'pl', 'Zarejestruj', 'buttons'),
('button.upload', 'en', 'Upload', 'buttons'),
('button.upload', 'pl', 'Prześlij', 'buttons'),
('button.download', 'en', 'Download', 'buttons'),
('button.download', 'pl', 'Pobierz', 'buttons'),
('button.search', 'en', 'Search', 'buttons'),
('button.search', 'pl', 'Szukaj', 'buttons'),
('button.filter', 'en', 'Filter', 'buttons'),
('button.filter', 'pl', 'Filtruj', 'buttons'),
('button.upgrade', 'en', 'Upgrade to Premium', 'buttons'),
('button.upgrade', 'pl', 'Przejdź na Premium', 'buttons'),
('button.subscribe', 'en', 'Subscribe', 'buttons'),
('button.subscribe', 'pl', 'Subskrybuj', 'buttons'),

-- Labels
('label.name', 'en', 'Name', 'labels'),
('label.name', 'pl', 'Nazwa', 'labels'),
('label.description', 'en', 'Description', 'labels'),
('label.description', 'pl', 'Opis', 'labels'),
('label.instructions', 'en', 'Instructions', 'labels'),
('label.instructions', 'pl', 'Instrukcje', 'labels'),
('label.difficulty', 'en', 'Difficulty', 'labels'),
('label.difficulty', 'pl', 'Poziom trudności', 'labels'),
('label.category', 'en', 'Category', 'labels'),
('label.category', 'pl', 'Kategoria', 'labels'),
('label.tags', 'en', 'Tags', 'labels'),
('label.tags', 'pl', 'Tagi', 'labels'),
('label.email', 'en', 'Email', 'labels'),
('label.email', 'pl', 'Email', 'labels'),
('label.password', 'en', 'Password', 'labels'),
('label.password', 'pl', 'Hasło', 'labels'),
('label.username', 'en', 'Username', 'labels'),
('label.username', 'pl', 'Nazwa użytkownika', 'labels'),
('label.bio', 'en', 'Bio', 'labels'),
('label.bio', 'pl', 'Biografia', 'labels'),
('label.language', 'en', 'Language', 'labels'),
('label.language', 'pl', 'Język', 'labels'),

-- Messages
('message.success.saved', 'en', 'Successfully saved', 'messages'),
('message.success.saved', 'pl', 'Pomyślnie zapisano', 'messages'),
('message.success.deleted', 'en', 'Successfully deleted', 'messages'),
('message.success.deleted', 'pl', 'Pomyślnie usunięto', 'messages'),
('message.success.created', 'en', 'Successfully created', 'messages'),
('message.success.created', 'pl', 'Pomyślnie utworzono', 'messages'),
('message.success.updated', 'en', 'Successfully updated', 'messages'),
('message.success.updated', 'pl', 'Pomyślnie zaktualizowano', 'messages'),
('message.error.generic', 'en', 'Something went wrong', 'messages'),
('message.error.generic', 'pl', 'Coś poszło nie tak', 'messages'),
('message.error.network', 'en', 'Network error', 'messages'),
('message.error.network', 'pl', 'Błąd sieci', 'messages'),
('message.error.unauthorized', 'en', 'You are not authorized', 'messages'),
('message.error.unauthorized', 'pl', 'Nie masz uprawnień', 'messages'),
('message.confirm.delete', 'en', 'Are you sure you want to delete this?', 'messages'),
('message.confirm.delete', 'pl', 'Czy na pewno chcesz to usunąć?', 'messages'),
('message.loading', 'en', 'Loading...', 'messages'),
('message.loading', 'pl', 'Ładowanie...', 'messages'),
('message.no_data', 'en', 'No data available', 'messages'),
('message.no_data', 'pl', 'Brak danych', 'messages'),

-- Alerts
('alert.success', 'en', 'Success!', 'alerts'),
('alert.success', 'pl', 'Sukces!', 'alerts'),
('alert.error', 'en', 'Error!', 'alerts'),
('alert.error', 'pl', 'Błąd!', 'alerts'),
('alert.warning', 'en', 'Warning!', 'alerts'),
('alert.warning', 'pl', 'Ostrzeżenie!', 'alerts'),
('alert.info', 'en', 'Information', 'alerts'),
('alert.info', 'pl', 'Informacja', 'alerts'),

-- Exercise specific
('exercise.beginner', 'en', 'Beginner', 'labels'),
('exercise.beginner', 'pl', 'Początkujący', 'labels'),
('exercise.intermediate', 'en', 'Intermediate', 'labels'),
('exercise.intermediate', 'pl', 'Średnio zaawansowany', 'labels'),
('exercise.advanced', 'en', 'Advanced', 'labels'),
('exercise.advanced', 'pl', 'Zaawansowany', 'labels'),
('exercise.expert', 'en', 'Expert', 'labels'),
('exercise.expert', 'pl', 'Ekspert', 'labels'),
('exercise.silks', 'en', 'Silks', 'labels'),
('exercise.silks', 'pl', 'Jedwabie', 'labels'),
('exercise.hoop', 'en', 'Hoop', 'labels'),
('exercise.hoop', 'pl', 'Obręcz', 'labels'),
('exercise.pole', 'en', 'Pole', 'labels'),
('exercise.pole', 'pl', 'Rurka', 'labels'),
('exercise.straps', 'en', 'Straps', 'labels'),
('exercise.straps', 'pl', 'Pasy', 'labels'),

-- Settings
('settings.notifications', 'en', 'Notifications', 'labels'),
('settings.notifications', 'pl', 'Powiadomienia', 'labels'),
('settings.privacy', 'en', 'Privacy', 'labels'),
('settings.privacy', 'pl', 'Prywatność', 'labels'),
('settings.appearance', 'en', 'Appearance', 'labels'),
('settings.appearance', 'pl', 'Wygląd', 'labels'),
('settings.language', 'en', 'Language', 'labels'),
('settings.language', 'pl', 'Język', 'labels'),
('settings.account', 'en', 'Account', 'labels'),
('settings.account', 'pl', 'Konto', 'labels'),

-- Profile
('profile.posts', 'en', 'Posts', 'labels'),
('profile.posts', 'pl', 'Posty', 'labels'),
('profile.achievements', 'en', 'Achievements', 'labels'),
('profile.achievements', 'pl', 'Osiągnięcia', 'labels'),
('profile.saved', 'en', 'Saved', 'labels'),
('profile.saved', 'pl', 'Zapisane', 'labels'),
('profile.followers', 'en', 'Followers', 'labels'),
('profile.followers', 'pl', 'Obserwujący', 'labels'),
('profile.following', 'en', 'Following', 'labels'),
('profile.following', 'pl', 'Obserwowani', 'labels'),

-- Time
('time.ago', 'en', 'ago', 'labels'),
('time.ago', 'pl', 'temu', 'labels'),
('time.now', 'en', 'now', 'labels'),
('time.now', 'pl', 'teraz', 'labels'),
('time.minute', 'en', 'minute', 'labels'),
('time.minute', 'pl', 'minuta', 'labels'),
('time.minutes', 'en', 'minutes', 'labels'),
('time.minutes', 'pl', 'minut', 'labels'),
('time.hour', 'en', 'hour', 'labels'),
('time.hour', 'pl', 'godzina', 'labels'),
('time.hours', 'en', 'hours', 'labels'),
('time.hours', 'pl', 'godzin', 'labels'),
('time.day', 'en', 'day', 'labels'),
('time.day', 'pl', 'dzień', 'labels'),
('time.days', 'en', 'days', 'labels'),
('time.days', 'pl', 'dni', 'labels');

-- Automatically add all existing figures to figure_translations for Polish
INSERT INTO public.figure_translations (figure_id, language_id, name, description, instructions, tags)
SELECT 
  id,
  'pl',
  name, -- Default to English name, admin can translate later
  description,
  instructions,
  tags
FROM public.figures
WHERE NOT EXISTS (
  SELECT 1 FROM public.figure_translations 
  WHERE figure_id = figures.id AND language_id = 'pl'
);

-- Also ensure English translations exist for all figures
INSERT INTO public.figure_translations (figure_id, language_id, name, description, instructions, tags)
SELECT 
  id,
  'en',
  name,
  description,
  instructions,
  tags
FROM public.figures
WHERE NOT EXISTS (
  SELECT 1 FROM public.figure_translations 
  WHERE figure_id = figures.id AND language_id = 'en'
);