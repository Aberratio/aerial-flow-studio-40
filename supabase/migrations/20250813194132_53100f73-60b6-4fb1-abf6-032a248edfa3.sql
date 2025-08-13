-- Add price field to challenges table
ALTER TABLE public.challenges 
ADD COLUMN price_usd INTEGER DEFAULT 999, -- Default $9.99 in cents
ADD COLUMN price_pln INTEGER DEFAULT 3999; -- Default 39.99 PLN in cents

-- Update existing premium challenges to have default prices
UPDATE public.challenges 
SET price_usd = 999, price_pln = 3999 
WHERE premium = true;