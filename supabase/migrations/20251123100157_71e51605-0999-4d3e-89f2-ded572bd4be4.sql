-- Remove the recursive trigger that syncs profiles -> user_roles
DROP TRIGGER IF EXISTS on_profile_role_change ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_user_roles_from_profile();

-- Update handle_new_user to create user_roles entry as well
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'free'
  );
  
  -- Create user_roles entry (definitive source of truth for roles)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Synchronize existing profiles to user_roles (in case any are missing)
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::user_role
FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;