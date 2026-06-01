-- Ensure animal_types has image_url for uploaded image links
ALTER TABLE public.animal_types
ADD COLUMN IF NOT EXISTS image_url TEXT;
