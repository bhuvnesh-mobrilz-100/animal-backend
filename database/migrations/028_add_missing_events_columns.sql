-- Add columns to events table that were defined in migration 012
-- but not applied because migration 007 already created the table

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS location_id BIGINT;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS max_attendees INTEGER;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS current_attendees INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS additional_info JSONB;

-- Foreign key for location_id (safe to add only if column was just added)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'location_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'events' AND ccu.column_name = 'location_id'
    ) THEN
      ALTER TABLE public.events
        ADD CONSTRAINT events_location_id_fkey
        FOREIGN KEY (location_id) REFERENCES public.locations(location_id);
    END IF;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_location_id ON public.events (location_id);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON public.events (end_date);
