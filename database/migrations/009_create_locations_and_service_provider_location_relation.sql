-- Create locations table and add location_id to service_providers
create table if not exists public.locations (
  location_id bigint generated always as identity not null,
  address text not null,
  latitude text null,
  longitude text null,
  show_publicly boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint locations_pkey primary key (location_id)
) tablespace pg_default;

alter table public.service_providers
  add column if not exists location_id bigint null;

-- Add foreign key constraint if not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'service_providers_location_id_fkey'
  ) then
    alter table public.service_providers
      add constraint service_providers_location_id_fkey
      foreign key (location_id)
      references public.locations(location_id);
  end if;
end$$;

create index if not exists idx_locations_address on public.locations (address);
create index if not exists idx_service_providers_location_id on public.service_providers (location_id);
