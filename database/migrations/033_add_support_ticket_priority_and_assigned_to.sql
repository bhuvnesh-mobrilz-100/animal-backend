-- Add priority, assigned_to, and image_url columns to support_tickets table

ALTER TABLE IF EXISTS public.support_tickets
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS assigned_to BIGINT REFERENCES public.users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to support_replies table
ALTER TABLE IF EXISTS public.support_replies
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for assigned_to for faster queries
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
