-- Add latitude and longitude columns to rescue_centres
ALTER TABLE public.rescue_centres
ADD COLUMN IF NOT EXISTS latitude FLOAT NULL,
ADD COLUMN IF NOT EXISTS longitude FLOAT NULL;
