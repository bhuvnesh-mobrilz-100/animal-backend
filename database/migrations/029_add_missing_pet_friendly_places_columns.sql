-- Add missing columns to pet_friendly_places table
alter table public.pet_friendly_places
  add column if not exists image_url text null,
  add column if not exists location_id bigint null references public.locations(location_id) on delete set null,
  add column if not exists rating integer not null default 0,
  add column if not exists views integer not null default 0,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists operating_hours jsonb null,
  add column if not exists amenities jsonb null,
  add column if not exists pet_policy text null;

-- Rename place_id to pet_friendly_place_id if old column name still exists
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pet_friendly_places' and column_name = 'place_id'
  ) then
    alter table public.pet_friendly_places rename column place_id to pet_friendly_place_id;
  end if;
end $$;

-- Add index on location_id for faster joins
create index if not exists idx_pet_friendly_places_location_id on public.pet_friendly_places(location_id);

-- Add index on is_deleted for filtering
create index if not exists idx_pet_friendly_places_is_deleted on public.pet_friendly_places(is_deleted);
