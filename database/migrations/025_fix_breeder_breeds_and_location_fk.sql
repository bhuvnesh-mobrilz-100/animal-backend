-- =============================
-- Create service_provider_breeds table (replaces breeder_breeds)
-- Direct relationship between service_providers and breeds
-- =============================

create table if not exists public.service_provider_breeds (
  id bigint generated always as identity not null,
  service_provider_id bigint not null references public.service_providers(service_provider_id) on delete cascade,
  breed_id bigint not null references public.breeds(breed_id),
  created_at timestamp with time zone not null default now(),
  constraint service_provider_breeds_pkey primary key (id),
  constraint service_provider_breeds_unique unique (service_provider_id, breed_id)
) tablespace pg_default;

create index if not exists idx_sp_breeds_service_provider_id on public.service_provider_breeds (service_provider_id);
create index if not exists idx_sp_breeds_breed_id on public.service_provider_breeds (breed_id);

-- Drop old breeder_breeds table if it exists
drop table if exists public.breeder_breeds;

-- =============================
-- Add FK constraint: service_providers.location_id -> locations.location_id
-- =============================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'service_providers_location_id_fkey'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'locations'
  ) then
    alter table public.service_providers
      add constraint service_providers_location_id_fkey
      foreign key (location_id)
      references public.locations(location_id);
  end if;
end$$;

-- =============================
-- Add FK constraint: service_providers.service_category_id -> service_categories
-- =============================
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'service_providers_service_category_id_fkey'
  ) and exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'service_categories'
  ) then
    alter table public.service_providers
      add constraint service_providers_service_category_id_fkey
      foreign key (service_category_id)
      references public.service_categories(service_category_id);
  end if;
end$$;

-- Ensure is_deleted column exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'service_providers' and column_name = 'is_deleted'
  ) then
    alter table public.service_providers add column is_deleted boolean not null default false;
  end if;
end$$;

-- =============================
-- Ensure breeds table exists (referenced by breeder_breeds FK)
-- =============================
create table if not exists public.breeds (
  breed_id bigint generated always as identity not null,
  animal_type_id bigint null,
  name text not null,
  description text null,
  is_active boolean null default true,
  created_at timestamp with time zone not null default now(),
  constraint breeds_pkey primary key (breed_id)
) tablespace pg_default;
