-- Fix security issue with orders table RLS policies
-- Remove the overly permissive policy that allows all operations
DROP POLICY IF EXISTS "Edge functions can manage orders" ON public.orders;

-- Create more specific policies for edge functions
-- Edge functions can insert new orders
CREATE POLICY "Edge functions can insert orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Edge functions can update order status  
CREATE POLICY "Edge functions can update orders" ON public.orders
  FOR UPDATE
  USING (true);

-- Ensure users can only view their own orders (this policy should already exist)
-- We'll recreate it to be certain
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT
  USING (user_id = auth.uid());