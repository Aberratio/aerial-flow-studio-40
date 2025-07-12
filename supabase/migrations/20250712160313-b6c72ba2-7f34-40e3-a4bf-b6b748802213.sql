-- Add missing English auth UI strings
INSERT INTO ui_strings (language_id, string_key, value, category) VALUES
-- Auth modal strings
('en', 'auth_welcome', 'Welcome to IguanaFlow', 'auth'),
('en', 'auth_signin', 'Sign In', 'auth'),
('en', 'auth_signup', 'Sign Up', 'auth'),
('en', 'auth_email', 'Email', 'auth'),
('en', 'auth_password', 'Password', 'auth'),
('en', 'auth_username', 'Username', 'auth'),
('en', 'auth_enter_email', 'Enter your email', 'auth'),
('en', 'auth_enter_password', 'Enter your password', 'auth'),
('en', 'auth_choose_username', 'Choose a username', 'auth'),
('en', 'auth_create_password', 'Create a password', 'auth'),
('en', 'auth_confirm_password', 'Confirm Password', 'auth'),
('en', 'auth_confirm_password_placeholder', 'Confirm your password', 'auth'),
('en', 'auth_signin_success', 'You have been successfully signed in.', 'auth'),
('en', 'auth_welcome_back', 'Welcome back!', 'auth'),
('en', 'auth_signin_failed', 'Sign in failed', 'auth'),
('en', 'auth_check_credentials', 'Please check your credentials and try again.', 'auth'),
('en', 'auth_password_mismatch', 'Password mismatch', 'auth'),
('en', 'auth_passwords_no_match', 'Passwords do not match. Please try again.', 'auth'),
('en', 'auth_account_created', 'Account created!', 'auth'),
('en', 'auth_verify_email', 'Please check your email to verify your account.', 'auth'),
('en', 'auth_signup_failed', 'Sign up failed', 'auth'),
('en', 'auth_try_again', 'Please try again.', 'auth'),
('en', 'auth_signing_in', 'Signing in...', 'auth'),
('en', 'auth_creating_account', 'Creating account...', 'auth'),
('en', 'auth_create_account', 'Create Account', 'auth')
ON CONFLICT (language_id, string_key) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = now();