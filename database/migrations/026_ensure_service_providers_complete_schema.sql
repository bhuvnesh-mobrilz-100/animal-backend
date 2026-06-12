-- =============================
-- Ensure service_providers table has all required columns
-- =============================

-- Add all columns that might be missing
alter table public.service_providers
  add column if not exists bio text null,
  add column if not exists image_url text null,
  add column if not exists emergency_number text null,
  add column if not exists number_2 text null,
  add column if not exists rating integer not null default 0,
  add column if not exists total_reviews integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists featured boolean not null default false,
  add column if not exists operating_hours jsonb null,
  add column if not exists location_id bigint null,
  add column if not exists service_category_id bigint null,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists views integer not null default 0;

-- Enable RLS
alter table public.service_providers enable row level security;

-- Drop existing policies to recreate
drop policy if exists "Authenticated users can select service_providers" on public.service_providers;
drop policy if exists "Authenticated users can insert service_providers" on public.service_providers;
drop policy if exists "Authenticated users can update service_providers" on public.service_providers;
drop policy if exists "Authenticated users can delete service_providers" on public.service_providers;

-- Create RLS policies
create policy "Authenticated users can select service_providers"
  on public.service_providers for select to authenticated using (true);

create policy "Authenticated users can insert service_providers"
  on public.service_providers for insert to authenticated with check (true);

create policy "Authenticated users can update service_providers"
  on public.service_providers for update to authenticated using (true) with check (true);

create policy "Authenticated users can delete service_providers"
  on public.service_providers for delete to authenticated using (true);

-- Allow public/anonymous read access (for public listing)
drop policy if exists "Public can select service_providers" on public.service_providers;
create policy "Public can select service_providers"
  on public.service_providers for select to anon using (true);
