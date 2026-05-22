-- Add user_name column to users if it is missing.
-- Some app code queries users.user_name, while older schema versions only had name.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Backfill user_name from name for existing rows.
UPDATE public.users
SET user_name = COALESCE(user_name, name)
WHERE user_name IS NULL AND name IS NOT NULL;

-- Also backfill name from user_name if needed to keep both columns usable.
UPDATE public.users
SET name = COALESCE(name, user_name)
WHERE name IS NULL AND user_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
