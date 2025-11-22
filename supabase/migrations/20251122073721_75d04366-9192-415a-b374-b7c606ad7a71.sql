-- Sprint 1: Add unique constraint and synchronize data

-- Step 1: Add unique constraint on user_id (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_key' 
    AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Step 2: Sync missing records from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Resolve conflicts - user_roles takes priority
UPDATE public.profiles p
SET role = ur.role, updated_at = now()
FROM public.user_roles ur
WHERE p.id = ur.user_id 
  AND p.role != ur.role;

-- Step 4: Create trigger function to sync profiles.role FROM user_roles
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET role = NEW.role,
      updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger on user_roles changes
DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;
CREATE TRIGGER on_user_role_change
  AFTER INSERT OR UPDATE OF role ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_from_user_roles();

-- Step 6: Create reverse trigger function to sync user_roles FROM profiles.role
CREATE OR REPLACE FUNCTION public.sync_user_roles_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.role)
  ON CONFLICT (user_id) 
  DO UPDATE SET role = NEW.role, updated_at = now();
  RETURN NEW;
END;
$$;

-- Step 7: Create trigger on profiles.role changes
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
CREATE TRIGGER on_profile_role_change
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_roles_from_profile();