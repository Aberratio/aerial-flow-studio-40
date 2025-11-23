-- Remove redundant unique constraint on user_roles
-- We only need UNIQUE (user_id) since one user should have one role
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Verify the remaining constraint exists
-- (user_roles_user_id_key should remain)