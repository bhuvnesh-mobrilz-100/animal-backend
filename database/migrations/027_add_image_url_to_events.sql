-- Add image_url column to events for uploaded event images
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_url TEXT;
