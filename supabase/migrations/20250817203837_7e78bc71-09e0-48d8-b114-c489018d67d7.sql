-- Add premium column to training_sessions table
ALTER TABLE public.training_sessions 
ADD COLUMN premium boolean NOT NULL DEFAULT false;

-- Create training_redemption_codes table (similar to challenge_redemption_codes)
CREATE TABLE public.training_redemption_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  training_session_id uuid REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on training_redemption_codes
ALTER TABLE public.training_redemption_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for training_redemption_codes
CREATE POLICY "Everyone can view active training codes" 
ON public.training_redemption_codes
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Trainers can manage training codes" 
ON public.training_redemption_codes
FOR ALL 
USING (auth.uid() IN (
  SELECT profiles.id FROM profiles 
  WHERE profiles.role = ANY(ARRAY['trainer'::user_role, 'admin'::user_role])
))
WITH CHECK (auth.uid() IN (
  SELECT profiles.id FROM profiles 
  WHERE profiles.role = ANY(ARRAY['trainer'::user_role, 'admin'::user_role])
));

-- Create table for tracking user training session purchases/redemptions
CREATE TABLE public.user_training_purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  training_session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  purchase_type text NOT NULL, -- 'subscription', 'individual_purchase', 'redemption_code'
  payment_amount integer,
  currency text DEFAULT 'usd',
  stripe_session_id text,
  redemption_code text,
  purchased_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, training_session_id)
);

-- Enable RLS on user_training_purchases
ALTER TABLE public.user_training_purchases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_training_purchases
CREATE POLICY "Users can view their own training purchases" 
ON public.user_training_purchases
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training purchases" 
ON public.user_training_purchases
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Edge functions can update training purchases" 
ON public.user_training_purchases
FOR UPDATE 
USING (true);