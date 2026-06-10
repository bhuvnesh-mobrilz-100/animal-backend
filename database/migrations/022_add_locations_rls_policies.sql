-- Ensure locations table exists (in case migration 009 wasn't run)
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

-- Enable RLS on locations table
alter table public.locations enable row level security;

-- Allow authenticated users to select all locations
drop policy if exists "Authenticated users can select locations" on public.locations;
create policy "Authenticated users can select locations"
  on public.locations
  for select
  to authenticated
  using (true);

-- Allow anon users to select publicly visible locations
drop policy if exists "Anon users can select public locations" on public.locations;
create policy "Anon users can select public locations"
  on public.locations
  for select
  to anon
  using (show_publicly = true);

-- Allow authenticated users to insert locations
drop policy if exists "Authenticated users can insert locations" on public.locations;
create policy "Authenticated users can insert locations"
  on public.locations
  for insert
  to authenticated
  with check (true);

-- Allow authenticated users to update locations
drop policy if exists "Authenticated users can update locations" on public.locations;
create policy "Authenticated users can update locations"
  on public.locations
  for update
  to authenticated
  using (true)
  with check (true);

-- Allow authenticated users to delete locations
drop policy if exists "Authenticated users can delete locations" on public.locations;
create policy "Authenticated users can delete locations"
  on public.locations
  for delete
  to authenticated
  using (true);
