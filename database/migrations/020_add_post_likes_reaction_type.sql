-- Add reaction type to community post likes so likes and dislikes are supported
ALTER TABLE public.post_likes
  ADD COLUMN IF NOT EXISTS reaction TEXT NOT NULL DEFAULT 'like';

CREATE INDEX IF NOT EXISTS idx_post_likes_reaction ON public.post_likes(reaction);
