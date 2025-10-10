-- Enable Features and Pricing sections on landing page
UPDATE landing_page_sections 
SET is_active = true 
WHERE section_key IN ('features', 'pricing');