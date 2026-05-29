-- Add image support to animal_types for the CRUD form and preview UI
ALTER TABLE public.animal_types
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.animal_types
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();