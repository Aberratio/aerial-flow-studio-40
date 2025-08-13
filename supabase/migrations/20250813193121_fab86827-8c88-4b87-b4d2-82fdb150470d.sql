-- Create table for tracking individual challenge purchases
CREATE TABLE IF NOT EXISTS public.user_challenge_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('payment', 'code')),
  payment_amount INTEGER, -- in cents, only for payment purchases
  currency TEXT DEFAULT 'usd',
  stripe_session_id TEXT, -- only for payment purchases
  redemption_code TEXT, -- only for code purchases
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure user can't purchase same challenge multiple times
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_challenge_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purchases" 
ON public.user_challenge_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" 
ON public.user_challenge_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Edge functions can update purchases" 
ON public.user_challenge_purchases 
FOR UPDATE 
USING (true);

-- Create table for managing redemption codes
CREATE TABLE IF NOT EXISTS public.challenge_redemption_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  max_uses INTEGER DEFAULT 1, -- how many times the code can be used
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CHECK (current_uses <= max_uses)
);

-- Enable RLS
ALTER TABLE public.challenge_redemption_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for redemption codes
CREATE POLICY "Everyone can view active codes" 
ON public.challenge_redemption_codes 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Trainers can manage codes" 
ON public.challenge_redemption_codes 
FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM public.profiles 
  WHERE role IN ('trainer', 'admin')
));

-- Create function to check if user has access to premium challenge
CREATE OR REPLACE FUNCTION public.user_has_challenge_access(p_user_id UUID, p_challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  challenge_premium BOOLEAN;
  user_has_premium BOOLEAN;
  user_purchased BOOLEAN;
BEGIN
  -- Check if challenge is premium
  SELECT premium INTO challenge_premium
  FROM public.challenges
  WHERE id = p_challenge_id;
  
  -- If not premium, access is allowed
  IF NOT challenge_premium THEN
    RETURN true;
  END IF;
  
  -- Check if user has premium subscription
  SELECT role IN ('premium', 'trainer', 'admin') INTO user_has_premium
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- If user has premium subscription, access is allowed
  IF user_has_premium THEN
    RETURN true;
  END IF;
  
  -- Check if user purchased this specific challenge
  SELECT EXISTS(
    SELECT 1 FROM public.user_challenge_purchases
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id
  ) INTO user_purchased;
  
  RETURN user_purchased;
END;
$$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_challenge_purchases_updated_at
  BEFORE UPDATE ON public.user_challenge_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_challenge_redemption_codes_updated_at
  BEFORE UPDATE ON public.challenge_redemption_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();