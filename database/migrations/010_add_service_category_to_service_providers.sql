-- Add service_category_id to service_providers and create the foreign key relationship
alter table public.service_providers
  add column if not exists service_category_id bigint null;

-- Add foreign key constraint if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'service_providers_service_category_id_fkey'
  ) THEN
    ALTER TABLE public.service_providers
      ADD CONSTRAINT service_providers_service_category_id_fkey
      FOREIGN KEY (service_category_id)
      REFERENCES public.service_categories(service_category_id);
  END IF;
END$$;

create index if not exists idx_service_providers_service_category_id on public.service_providers (service_category_id);
-- Add is_deleted column to service_providers for soft-delete support
alter table public.service_providers
  add column if not exists is_deleted boolean not null default false;

create index if not exists idx_service_providers_is_deleted on public.service_providers (is_deleted);
