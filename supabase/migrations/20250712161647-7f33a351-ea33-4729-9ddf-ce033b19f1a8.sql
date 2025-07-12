-- Add missing authentication UI strings for English
INSERT INTO ui_strings (language_id, string_key, value, category, created_at, updated_at) VALUES
-- Registration form strings
('en', 'auth_choose_username', 'Choose a username', 'auth', now(), now()),
('en', 'auth_username_placeholder', 'Enter your username', 'auth', now(), now()),
('en', 'auth_username_required', 'Username is required', 'auth', now(), now()),
('en', 'auth_username_min_length', 'Username must be at least 3 characters', 'auth', now(), now()),
('en', 'auth_email_required', 'Email is required', 'auth', now(), now()),
('en', 'auth_email_invalid', 'Please enter a valid email', 'auth', now(), now()),
('en', 'auth_password_required', 'Password is required', 'auth', now(), now()),
('en', 'auth_password_min_length', 'Password must be at least 6 characters', 'auth', now(), now()),
('en', 'auth_terms_required', 'You must accept the terms and conditions', 'auth', now(), now()),
('en', 'auth_create_account_success', 'Account created successfully! Please check your email to verify your account.', 'auth', now(), now()),
('en', 'auth_login_success', 'Welcome back!', 'auth', now(), now()),
('en', 'auth_logout_success', 'See you later!', 'auth', now(), now()),
('en', 'auth_error_user_exists', 'User already exists with this email', 'auth', now(), now()),
('en', 'auth_error_invalid_credentials', 'Invalid email or password', 'auth', now(), now()),
('en', 'auth_error_generic', 'An error occurred. Please try again.', 'auth', now(), now())

ON CONFLICT (language_id, string_key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();