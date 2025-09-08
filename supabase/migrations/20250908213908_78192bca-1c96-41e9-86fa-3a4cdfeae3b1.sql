-- Allow admins to manage challenge day progress across users and ensure RPC is callable

-- Grant execute on admin RPC
GRANT EXECUTE ON FUNCTION public.admin_complete_challenge_day(p_user_id uuid, p_challenge_id uuid, p_day_number integer, p_notes text) TO authenticated;

-- Admin policies for challenge_day_progress
DROP POLICY IF EXISTS "Admins can view any challenge day progress" ON public.challenge_day_progress;
CREATE POLICY "Admins can view any challenge day progress"
ON public.challenge_day_progress
FOR SELECT
USING (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can insert challenge day progress" ON public.challenge_day_progress;
CREATE POLICY "Admins can insert challenge day progress"
ON public.challenge_day_progress
FOR INSERT
WITH CHECK (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can update any challenge day progress" ON public.challenge_day_progress;
CREATE POLICY "Admins can update any challenge day progress"
ON public.challenge_day_progress
FOR UPDATE
USING (public.get_current_user_role() = 'admin');