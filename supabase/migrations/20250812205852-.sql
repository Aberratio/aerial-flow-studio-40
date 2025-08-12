-- Fix security issue with subscribers table RLS policies
-- Remove the overly permissive policy that allows all operations
DROP POLICY IF EXISTS "Edge functions can manage subscriptions" ON public.subscribers;

-- Create more specific policies for edge functions
-- Edge functions can insert new subscribers
CREATE POLICY "Edge functions can insert subscribers" ON public.subscribers
  FOR INSERT
  WITH CHECK (true);

-- Edge functions can update subscription data
CREATE POLICY "Edge functions can update subscribers" ON public.subscribers
  FOR UPDATE
  USING (true);

-- Ensure the user policy is properly restrictive
-- Users can only view their own subscription data
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      (user_id IS NOT NULL AND user_id = auth.uid()) OR 
      (email IS NOT NULL AND email = auth.email())
    )
  );