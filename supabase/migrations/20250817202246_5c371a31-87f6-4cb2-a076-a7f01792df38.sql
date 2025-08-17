-- ============================================================
-- FIX FINAL SEARCH PATH SECURITY WARNINGS
-- ============================================================

-- Fix the remaining functions that don't have search_path set

-- 1. Fix update_landing_page_updated_at function (trigger function)
CREATE OR REPLACE FUNCTION public.update_landing_page_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 2. Fix update_user_follows_updated_at function (trigger function)
CREATE OR REPLACE FUNCTION public.update_user_follows_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 3. Fix handle_new_user function (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'free'
  );
  RETURN NEW;
END;
$function$;

-- 4. Fix update_updated_at_column function (trigger function)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;