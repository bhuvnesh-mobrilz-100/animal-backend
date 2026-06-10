-- Add image_url column to community_posts for post images
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS image_url TEXT;
