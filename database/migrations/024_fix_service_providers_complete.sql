-- =============================
-- Add all missing columns to service_providers
-- =============================

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
  add column if not exists is_deleted boolean not null default false;

-- =============================
-- Create services table if not exists
-- =============================
create table if not exists public.services (
  service_id bigint generated always as identity not null,
  service_provider_id bigint not null references public.service_providers(service_provider_id) on delete cascade,
  name text not null,
  description text null,
  price numeric(10,2) null,
  duration_minutes integer null,
  is_active boolean not null default true,
  additional_info jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint services_pkey primary key (service_id)
) tablespace pg_default;

create index if not exists idx_services_service_provider_id on public.services (service_provider_id);

-- =============================
-- Create service_provider_images table if not exists
-- =============================
create table if not exists public.service_provider_images (
  service_provider_image bigint generated always as identity not null,
  service_provider_id bigint not null references public.service_providers(service_provider_id) on delete cascade,
  image_url text not null,
  "order" integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint service_provider_images_pkey primary key (service_provider_image)
) tablespace pg_default;

create index if not exists idx_service_provider_images_service_provider_id on public.service_provider_images (service_provider_id);

-- =============================
-- Enable RLS on services and service_provider_images
-- =============================
alter table public.services enable row level security;
alter table public.service_provider_images enable row level security;

drop policy if exists "Authenticated users can select services" on public.services;
create policy "Authenticated users can select services"
  on public.services for select to authenticated using (true);

drop policy if exists "Authenticated users can insert services" on public.services;
create policy "Authenticated users can insert services"
  on public.services for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update services" on public.services;
create policy "Authenticated users can update services"
  on public.services for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete services" on public.services;
create policy "Authenticated users can delete services"
  on public.services for delete to authenticated using (true);

drop policy if exists "Authenticated users can select service_provider_images" on public.service_provider_images;
create policy "Authenticated users can select service_provider_images"
  on public.service_provider_images for select to authenticated using (true);

drop policy if exists "Authenticated users can insert service_provider_images" on public.service_provider_images;
create policy "Authenticated users can insert service_provider_images"
  on public.service_provider_images for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update service_provider_images" on public.service_provider_images;
create policy "Authenticated users can update service_provider_images"
  on public.service_provider_images for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete service_provider_images" on public.service_provider_images;
create policy "Authenticated users can delete service_provider_images"
  on public.service_provider_images for delete to authenticated using (true);
