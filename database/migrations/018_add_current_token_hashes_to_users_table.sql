-- Add current access and refresh token hashes to users table for strict session invalidation
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS current_access_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS current_refresh_token_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_users_current_access_token_hash ON public.users (current_access_token_hash);
CREATE INDEX IF NOT EXISTS idx_users_current_refresh_token_hash ON public.users (current_refresh_token_hash);
