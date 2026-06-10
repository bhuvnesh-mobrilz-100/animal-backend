-- Add missing columns to service_providers table
alter table public.service_providers
  add column if not exists bio text null,
  add column if not exists image_url text null,
  add column if not exists emergency_number text null,
  add column if not exists number_2 text null,
  add column if not exists rating integer not null default 0,
  add column if not exists total_reviews integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists featured boolean not null default false,
  add column if not exists operating_hours jsonb null;

-- Drop the old address column if it exists (now using locations table)
alter table public.service_providers
  drop column if exists address;

-- Drop the old service_type column if it exists (now using service_categories)
alter table public.service_providers
  drop column if exists service_type;

-- Drop the old user_id column if it exists (using auth users now)
alter table public.service_providers
  drop column if exists user_id;
