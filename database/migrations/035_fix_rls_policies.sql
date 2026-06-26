-- =============================
-- MIGRATION 035: FIX RLS POLICIES FOR ALL TABLES AND STORAGE
-- Resolves "new row violates row-level security policy" errors
-- during image uploads and other client-side operations.
-- =============================

-- =============================
-- PART 1: STORAGE BUCKET POLICIES
-- Ensures the animalclickposts bucket has proper RLS policies
-- so client-side uploads/deletes (using anon key) work.
-- =============================

-- Ensure the bucket exists
insert into storage.buckets (id, name, public)
values ('animalclickposts', 'animalclickposts', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

-- Allow public/anonymous users to view files
drop policy if exists "Public can view files" on storage.objects;
create policy "Public can view files"
  on storage.objects for select
  to anon
  using (bucket_id = 'animalclickposts');

-- Allow authenticated users to view files
drop policy if exists "Authenticated users can view files" on storage.objects;
create policy "Authenticated users can view files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'animalclickposts');

-- Allow authenticated users to upload files
drop policy if exists "Authenticated users can upload files" on storage.objects;
create policy "Authenticated users can upload files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'animalclickposts');

-- Allow authenticated users to update files
drop policy if exists "Authenticated users can update files" on storage.objects;
create policy "Authenticated users can update files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'animalclickposts')
  with check (bucket_id = 'animalclickposts');

-- Allow authenticated users to delete files
drop policy if exists "Authenticated users can delete files" on storage.objects;
create policy "Authenticated users can delete files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'animalclickposts');


-- =============================
-- PART 2: VENDORS TABLE (CREATED MANUALLY, NOT IN EARLIER MIGRATIONS)
-- =============================

create table if not exists public.vendors (
  vendor_id bigint generated always as identity not null,
  name text not null,
  email text null,
  phone text null,
  vendor_image_url text null,
  view_count integer not null default 0,
  average_vendor_rating numeric(3,2) not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint vendors_pkey primary key (vendor_id)
) tablespace pg_default;

alter table public.vendors enable row level security;

drop policy if exists "Public can select vendors" on public.vendors;
create policy "Public can select vendors"
  on public.vendors for select
  to anon
  using (true);

drop policy if exists "Authenticated users can select vendors" on public.vendors;
create policy "Authenticated users can select vendors"
  on public.vendors for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert vendors" on public.vendors;
create policy "Authenticated users can insert vendors"
  on public.vendors for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update vendors" on public.vendors;
create policy "Authenticated users can update vendors"
  on public.vendors for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete vendors" on public.vendors;
create policy "Authenticated users can delete vendors"
  on public.vendors for delete
  to authenticated
  using (true);

create index if not exists idx_vendors_name on public.vendors (name);


-- =============================
-- PART 3: VENDOR LOCATIONS TABLE (CREATED MANUALLY)
-- =============================

create table if not exists public.vendor_locations (
  vendor_location_id bigint generated always as identity not null,
  vendor_id bigint not null references public.vendors(vendor_id) on delete cascade,
  name text not null,
  online_only boolean not null default false,
  address text null,
  latitude numeric(10,7) null,
  longitude numeric(10,7) null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint vendor_locations_pkey primary key (vendor_location_id)
) tablespace pg_default;

alter table public.vendor_locations enable row level security;

drop policy if exists "Public can select vendor_locations" on public.vendor_locations;
create policy "Public can select vendor_locations"
  on public.vendor_locations for select
  to anon
  using (true);

drop policy if exists "Authenticated users can select vendor_locations" on public.vendor_locations;
create policy "Authenticated users can select vendor_locations"
  on public.vendor_locations for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert vendor_locations" on public.vendor_locations;
create policy "Authenticated users can insert vendor_locations"
  on public.vendor_locations for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update vendor_locations" on public.vendor_locations;
create policy "Authenticated users can update vendor_locations"
  on public.vendor_locations for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete vendor_locations" on public.vendor_locations;
create policy "Authenticated users can delete vendor_locations"
  on public.vendor_locations for delete
  to authenticated
  using (true);

create index if not exists idx_vendor_locations_vendor_id on public.vendor_locations (vendor_id);


-- =============================
-- PART 4: ENABLE RLS AND ADD POLICIES FOR ALL TABLES
-- Uses pattern: authenticated CRUD, anon SELECT (public read)
-- =============================

-- Helper function to create standard policies for any table
do $$ begin
  perform 1;
end $$;

-- =============================
-- 4.1: permissions
-- =============================
alter table public.permissions enable row level security;

drop policy if exists "Public can select permissions" on public.permissions;
create policy "Public can select permissions"
  on public.permissions for select to anon using (true);

drop policy if exists "Authenticated users can select permissions" on public.permissions;
create policy "Authenticated users can select permissions"
  on public.permissions for select to authenticated using (true);

drop policy if exists "Authenticated users can insert permissions" on public.permissions;
create policy "Authenticated users can insert permissions"
  on public.permissions for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update permissions" on public.permissions;
create policy "Authenticated users can update permissions"
  on public.permissions for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete permissions" on public.permissions;
create policy "Authenticated users can delete permissions"
  on public.permissions for delete to authenticated using (true);


-- =============================
-- 4.2: roles
-- =============================
alter table public.roles enable row level security;

drop policy if exists "Public can select roles" on public.roles;
create policy "Public can select roles"
  on public.roles for select to anon using (true);

drop policy if exists "Authenticated users can select roles" on public.roles;
create policy "Authenticated users can select roles"
  on public.roles for select to authenticated using (true);

drop policy if exists "Authenticated users can insert roles" on public.roles;
create policy "Authenticated users can insert roles"
  on public.roles for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update roles" on public.roles;
create policy "Authenticated users can update roles"
  on public.roles for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete roles" on public.roles;
create policy "Authenticated users can delete roles"
  on public.roles for delete to authenticated using (true);


-- =============================
-- 4.3: role_permissions
-- =============================
alter table public.role_permissions enable row level security;

drop policy if exists "Public can select role_permissions" on public.role_permissions;
create policy "Public can select role_permissions"
  on public.role_permissions for select to anon using (true);

drop policy if exists "Authenticated users can select role_permissions" on public.role_permissions;
create policy "Authenticated users can select role_permissions"
  on public.role_permissions for select to authenticated using (true);

drop policy if exists "Authenticated users can insert role_permissions" on public.role_permissions;
create policy "Authenticated users can insert role_permissions"
  on public.role_permissions for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update role_permissions" on public.role_permissions;
create policy "Authenticated users can update role_permissions"
  on public.role_permissions for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete role_permissions" on public.role_permissions;
create policy "Authenticated users can delete role_permissions"
  on public.role_permissions for delete to authenticated using (true);


-- =============================
-- 4.4: users
-- =============================
alter table public.users enable row level security;

drop policy if exists "Public can select users" on public.users;
create policy "Public can select users"
  on public.users for select to anon using (true);

drop policy if exists "Authenticated users can select users" on public.users;
create policy "Authenticated users can select users"
  on public.users for select to authenticated using (true);

drop policy if exists "Authenticated users can insert users" on public.users;
create policy "Authenticated users can insert users"
  on public.users for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update users" on public.users;
create policy "Authenticated users can update users"
  on public.users for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete users" on public.users;
create policy "Authenticated users can delete users"
  on public.users for delete to authenticated using (true);


-- =============================
-- 4.5: user_roles
-- =============================
alter table public.user_roles enable row level security;

drop policy if exists "Public can select user_roles" on public.user_roles;
create policy "Public can select user_roles"
  on public.user_roles for select to anon using (true);

drop policy if exists "Authenticated users can select user_roles" on public.user_roles;
create policy "Authenticated users can select user_roles"
  on public.user_roles for select to authenticated using (true);

drop policy if exists "Authenticated users can insert user_roles" on public.user_roles;
create policy "Authenticated users can insert user_roles"
  on public.user_roles for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update user_roles" on public.user_roles;
create policy "Authenticated users can update user_roles"
  on public.user_roles for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete user_roles" on public.user_roles;
create policy "Authenticated users can delete user_roles"
  on public.user_roles for delete to authenticated using (true);


-- =============================
-- 4.7: vets
-- =============================
alter table public.vets enable row level security;

drop policy if exists "Public can select vets" on public.vets;
create policy "Public can select vets"
  on public.vets for select to anon using (true);

drop policy if exists "Authenticated users can select vets" on public.vets;
create policy "Authenticated users can select vets"
  on public.vets for select to authenticated using (true);

drop policy if exists "Authenticated users can insert vets" on public.vets;
create policy "Authenticated users can insert vets"
  on public.vets for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update vets" on public.vets;
create policy "Authenticated users can update vets"
  on public.vets for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete vets" on public.vets;
create policy "Authenticated users can delete vets"
  on public.vets for delete to authenticated using (true);


-- =============================
-- 4.8: pet_friendly_places
-- =============================
alter table public.pet_friendly_places enable row level security;

drop policy if exists "Public can select pet_friendly_places" on public.pet_friendly_places;
create policy "Public can select pet_friendly_places"
  on public.pet_friendly_places for select to anon using (true);

drop policy if exists "Authenticated users can select pet_friendly_places" on public.pet_friendly_places;
create policy "Authenticated users can select pet_friendly_places"
  on public.pet_friendly_places for select to authenticated using (true);

drop policy if exists "Authenticated users can insert pet_friendly_places" on public.pet_friendly_places;
create policy "Authenticated users can insert pet_friendly_places"
  on public.pet_friendly_places for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update pet_friendly_places" on public.pet_friendly_places;
create policy "Authenticated users can update pet_friendly_places"
  on public.pet_friendly_places for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete pet_friendly_places" on public.pet_friendly_places;
create policy "Authenticated users can delete pet_friendly_places"
  on public.pet_friendly_places for delete to authenticated using (true);


-- =============================
-- 4.9: service_categories
-- =============================
alter table public.service_categories enable row level security;

drop policy if exists "Public can select service_categories" on public.service_categories;
create policy "Public can select service_categories"
  on public.service_categories for select to anon using (true);

drop policy if exists "Authenticated users can select service_categories" on public.service_categories;
create policy "Authenticated users can select service_categories"
  on public.service_categories for select to authenticated using (true);

drop policy if exists "Authenticated users can insert service_categories" on public.service_categories;
create policy "Authenticated users can insert service_categories"
  on public.service_categories for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update service_categories" on public.service_categories;
create policy "Authenticated users can update service_categories"
  on public.service_categories for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete service_categories" on public.service_categories;
create policy "Authenticated users can delete service_categories"
  on public.service_categories for delete to authenticated using (true);


-- =============================
-- 4.10: boost_packages
-- =============================
alter table public.boost_packages enable row level security;

drop policy if exists "Public can select boost_packages" on public.boost_packages;
create policy "Public can select boost_packages"
  on public.boost_packages for select to anon using (true);

drop policy if exists "Authenticated users can select boost_packages" on public.boost_packages;
create policy "Authenticated users can select boost_packages"
  on public.boost_packages for select to authenticated using (true);

drop policy if exists "Authenticated users can insert boost_packages" on public.boost_packages;
create policy "Authenticated users can insert boost_packages"
  on public.boost_packages for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update boost_packages" on public.boost_packages;
create policy "Authenticated users can update boost_packages"
  on public.boost_packages for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete boost_packages" on public.boost_packages;
create policy "Authenticated users can delete boost_packages"
  on public.boost_packages for delete to authenticated using (true);


-- =============================
-- 4.11: entity_boosts
-- =============================
alter table public.entity_boosts enable row level security;

drop policy if exists "Public can select entity_boosts" on public.entity_boosts;
create policy "Public can select entity_boosts"
  on public.entity_boosts for select to anon using (true);

drop policy if exists "Authenticated users can select entity_boosts" on public.entity_boosts;
create policy "Authenticated users can select entity_boosts"
  on public.entity_boosts for select to authenticated using (true);

drop policy if exists "Authenticated users can insert entity_boosts" on public.entity_boosts;
create policy "Authenticated users can insert entity_boosts"
  on public.entity_boosts for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update entity_boosts" on public.entity_boosts;
create policy "Authenticated users can update entity_boosts"
  on public.entity_boosts for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete entity_boosts" on public.entity_boosts;
create policy "Authenticated users can delete entity_boosts"
  on public.entity_boosts for delete to authenticated using (true);


-- =============================
-- 4.12: animal_types
-- =============================
alter table public.animal_types enable row level security;

drop policy if exists "Public can select animal_types" on public.animal_types;
create policy "Public can select animal_types"
  on public.animal_types for select to anon using (true);

drop policy if exists "Authenticated users can select animal_types" on public.animal_types;
create policy "Authenticated users can select animal_types"
  on public.animal_types for select to authenticated using (true);

drop policy if exists "Authenticated users can insert animal_types" on public.animal_types;
create policy "Authenticated users can insert animal_types"
  on public.animal_types for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update animal_types" on public.animal_types;
create policy "Authenticated users can update animal_types"
  on public.animal_types for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete animal_types" on public.animal_types;
create policy "Authenticated users can delete animal_types"
  on public.animal_types for delete to authenticated using (true);


-- =============================
-- 4.13: breeds
-- =============================
alter table public.breeds enable row level security;

drop policy if exists "Public can select breeds" on public.breeds;
create policy "Public can select breeds"
  on public.breeds for select to anon using (true);

drop policy if exists "Authenticated users can select breeds" on public.breeds;
create policy "Authenticated users can select breeds"
  on public.breeds for select to authenticated using (true);

drop policy if exists "Authenticated users can insert breeds" on public.breeds;
create policy "Authenticated users can insert breeds"
  on public.breeds for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update breeds" on public.breeds;
create policy "Authenticated users can update breeds"
  on public.breeds for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete breeds" on public.breeds;
create policy "Authenticated users can delete breeds"
  on public.breeds for delete to authenticated using (true);


-- =============================
-- 4.14: groups
-- =============================
alter table public.groups enable row level security;

drop policy if exists "Public can select groups" on public.groups;
create policy "Public can select groups"
  on public.groups for select to anon using (true);

drop policy if exists "Authenticated users can select groups" on public.groups;
create policy "Authenticated users can select groups"
  on public.groups for select to authenticated using (true);

drop policy if exists "Authenticated users can insert groups" on public.groups;
create policy "Authenticated users can insert groups"
  on public.groups for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update groups" on public.groups;
create policy "Authenticated users can update groups"
  on public.groups for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete groups" on public.groups;
create policy "Authenticated users can delete groups"
  on public.groups for delete to authenticated using (true);


-- =============================
-- 4.15: place_groups
-- =============================
alter table public.place_groups enable row level security;

drop policy if exists "Public can select place_groups" on public.place_groups;
create policy "Public can select place_groups"
  on public.place_groups for select to anon using (true);

drop policy if exists "Authenticated users can select place_groups" on public.place_groups;
create policy "Authenticated users can select place_groups"
  on public.place_groups for select to authenticated using (true);

drop policy if exists "Authenticated users can insert place_groups" on public.place_groups;
create policy "Authenticated users can insert place_groups"
  on public.place_groups for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update place_groups" on public.place_groups;
create policy "Authenticated users can update place_groups"
  on public.place_groups for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete place_groups" on public.place_groups;
create policy "Authenticated users can delete place_groups"
  on public.place_groups for delete to authenticated using (true);


-- =============================
-- 4.16: event_categories
-- =============================
alter table public.event_categories enable row level security;

drop policy if exists "Public can select event_categories" on public.event_categories;
create policy "Public can select event_categories"
  on public.event_categories for select to anon using (true);

drop policy if exists "Authenticated users can select event_categories" on public.event_categories;
create policy "Authenticated users can select event_categories"
  on public.event_categories for select to authenticated using (true);

drop policy if exists "Authenticated users can insert event_categories" on public.event_categories;
create policy "Authenticated users can insert event_categories"
  on public.event_categories for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update event_categories" on public.event_categories;
create policy "Authenticated users can update event_categories"
  on public.event_categories for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete event_categories" on public.event_categories;
create policy "Authenticated users can delete event_categories"
  on public.event_categories for delete to authenticated using (true);


-- =============================
-- 4.17: events
-- =============================
alter table public.events enable row level security;

drop policy if exists "Public can select events" on public.events;
create policy "Public can select events"
  on public.events for select to anon using (true);

drop policy if exists "Authenticated users can select events" on public.events;
create policy "Authenticated users can select events"
  on public.events for select to authenticated using (true);

drop policy if exists "Authenticated users can insert events" on public.events;
create policy "Authenticated users can insert events"
  on public.events for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update events" on public.events;
create policy "Authenticated users can update events"
  on public.events for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete events" on public.events;
create policy "Authenticated users can delete events"
  on public.events for delete to authenticated using (true);


-- =============================
-- 4.18: community_posts
-- =============================
alter table public.community_posts enable row level security;

drop policy if exists "Public can select community_posts" on public.community_posts;
create policy "Public can select community_posts"
  on public.community_posts for select to anon using (true);

drop policy if exists "Authenticated users can select community_posts" on public.community_posts;
create policy "Authenticated users can select community_posts"
  on public.community_posts for select to authenticated using (true);

drop policy if exists "Authenticated users can insert community_posts" on public.community_posts;
create policy "Authenticated users can insert community_posts"
  on public.community_posts for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update community_posts" on public.community_posts;
create policy "Authenticated users can update community_posts"
  on public.community_posts for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete community_posts" on public.community_posts;
create policy "Authenticated users can delete community_posts"
  on public.community_posts for delete to authenticated using (true);


-- =============================
-- 4.19: post_likes
-- =============================
alter table public.post_likes enable row level security;

drop policy if exists "Public can select post_likes" on public.post_likes;
create policy "Public can select post_likes"
  on public.post_likes for select to anon using (true);

drop policy if exists "Authenticated users can select post_likes" on public.post_likes;
create policy "Authenticated users can select post_likes"
  on public.post_likes for select to authenticated using (true);

drop policy if exists "Authenticated users can insert post_likes" on public.post_likes;
create policy "Authenticated users can insert post_likes"
  on public.post_likes for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update post_likes" on public.post_likes;
create policy "Authenticated users can update post_likes"
  on public.post_likes for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete post_likes" on public.post_likes;
create policy "Authenticated users can delete post_likes"
  on public.post_likes for delete to authenticated using (true);


-- =============================
-- 4.20: user_blocks
-- =============================
alter table public.user_blocks enable row level security;

drop policy if exists "Public can select user_blocks" on public.user_blocks;
create policy "Public can select user_blocks"
  on public.user_blocks for select to anon using (true);

drop policy if exists "Authenticated users can select user_blocks" on public.user_blocks;
create policy "Authenticated users can select user_blocks"
  on public.user_blocks for select to authenticated using (true);

drop policy if exists "Authenticated users can insert user_blocks" on public.user_blocks;
create policy "Authenticated users can insert user_blocks"
  on public.user_blocks for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update user_blocks" on public.user_blocks;
create policy "Authenticated users can update user_blocks"
  on public.user_blocks for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete user_blocks" on public.user_blocks;
create policy "Authenticated users can delete user_blocks"
  on public.user_blocks for delete to authenticated using (true);


-- =============================
-- 4.21: reviews
-- =============================
alter table public.reviews enable row level security;

drop policy if exists "Public can select reviews" on public.reviews;
create policy "Public can select reviews"
  on public.reviews for select to anon using (true);

drop policy if exists "Authenticated users can select reviews" on public.reviews;
create policy "Authenticated users can select reviews"
  on public.reviews for select to authenticated using (true);

drop policy if exists "Authenticated users can insert reviews" on public.reviews;
create policy "Authenticated users can insert reviews"
  on public.reviews for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update reviews" on public.reviews;
create policy "Authenticated users can update reviews"
  on public.reviews for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete reviews" on public.reviews;
create policy "Authenticated users can delete reviews"
  on public.reviews for delete to authenticated using (true);


-- =============================
-- 4.22: provider_requests
-- =============================
alter table public.provider_requests enable row level security;

drop policy if exists "Public can select provider_requests" on public.provider_requests;
create policy "Public can select provider_requests"
  on public.provider_requests for select to anon using (true);

drop policy if exists "Authenticated users can select provider_requests" on public.provider_requests;
create policy "Authenticated users can select provider_requests"
  on public.provider_requests for select to authenticated using (true);

drop policy if exists "Authenticated users can insert provider_requests" on public.provider_requests;
create policy "Authenticated users can insert provider_requests"
  on public.provider_requests for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update provider_requests" on public.provider_requests;
create policy "Authenticated users can update provider_requests"
  on public.provider_requests for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete provider_requests" on public.provider_requests;
create policy "Authenticated users can delete provider_requests"
  on public.provider_requests for delete to authenticated using (true);


-- =============================
-- 4.23: rescue_centres
-- =============================
alter table public.rescue_centres enable row level security;

drop policy if exists "Public can select rescue_centres" on public.rescue_centres;
create policy "Public can select rescue_centres"
  on public.rescue_centres for select to anon using (true);

drop policy if exists "Authenticated users can select rescue_centres" on public.rescue_centres;
create policy "Authenticated users can select rescue_centres"
  on public.rescue_centres for select to authenticated using (true);

drop policy if exists "Authenticated users can insert rescue_centres" on public.rescue_centres;
create policy "Authenticated users can insert rescue_centres"
  on public.rescue_centres for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update rescue_centres" on public.rescue_centres;
create policy "Authenticated users can update rescue_centres"
  on public.rescue_centres for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete rescue_centres" on public.rescue_centres;
create policy "Authenticated users can delete rescue_centres"
  on public.rescue_centres for delete to authenticated using (true);


-- =============================
-- 4.24: donation_campaigns
-- =============================
alter table public.donation_campaigns enable row level security;

drop policy if exists "Public can select donation_campaigns" on public.donation_campaigns;
create policy "Public can select donation_campaigns"
  on public.donation_campaigns for select to anon using (true);

drop policy if exists "Authenticated users can select donation_campaigns" on public.donation_campaigns;
create policy "Authenticated users can select donation_campaigns"
  on public.donation_campaigns for select to authenticated using (true);

drop policy if exists "Authenticated users can insert donation_campaigns" on public.donation_campaigns;
create policy "Authenticated users can insert donation_campaigns"
  on public.donation_campaigns for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update donation_campaigns" on public.donation_campaigns;
create policy "Authenticated users can update donation_campaigns"
  on public.donation_campaigns for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete donation_campaigns" on public.donation_campaigns;
create policy "Authenticated users can delete donation_campaigns"
  on public.donation_campaigns for delete to authenticated using (true);


-- =============================
-- 4.25: boost_package_links
-- =============================
alter table public.boost_package_links enable row level security;

drop policy if exists "Public can select boost_package_links" on public.boost_package_links;
create policy "Public can select boost_package_links"
  on public.boost_package_links for select to anon using (true);

drop policy if exists "Authenticated users can select boost_package_links" on public.boost_package_links;
create policy "Authenticated users can select boost_package_links"
  on public.boost_package_links for select to authenticated using (true);

drop policy if exists "Authenticated users can insert boost_package_links" on public.boost_package_links;
create policy "Authenticated users can insert boost_package_links"
  on public.boost_package_links for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update boost_package_links" on public.boost_package_links;
create policy "Authenticated users can update boost_package_links"
  on public.boost_package_links for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete boost_package_links" on public.boost_package_links;
create policy "Authenticated users can delete boost_package_links"
  on public.boost_package_links for delete to authenticated using (true);


-- =============================
-- 4.26: saved_places
-- =============================
alter table public.saved_places enable row level security;

drop policy if exists "Public can select saved_places" on public.saved_places;
create policy "Public can select saved_places"
  on public.saved_places for select to anon using (true);

drop policy if exists "Authenticated users can select saved_places" on public.saved_places;
create policy "Authenticated users can select saved_places"
  on public.saved_places for select to authenticated using (true);

drop policy if exists "Authenticated users can insert saved_places" on public.saved_places;
create policy "Authenticated users can insert saved_places"
  on public.saved_places for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update saved_places" on public.saved_places;
create policy "Authenticated users can update saved_places"
  on public.saved_places for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete saved_places" on public.saved_places;
create policy "Authenticated users can delete saved_places"
  on public.saved_places for delete to authenticated using (true);


-- =============================
-- 4.27: support_tickets
-- =============================
alter table public.support_tickets enable row level security;

drop policy if exists "Public can select support_tickets" on public.support_tickets;
create policy "Public can select support_tickets"
  on public.support_tickets for select to anon using (true);

drop policy if exists "Authenticated users can select support_tickets" on public.support_tickets;
create policy "Authenticated users can select support_tickets"
  on public.support_tickets for select to authenticated using (true);

drop policy if exists "Authenticated users can insert support_tickets" on public.support_tickets;
create policy "Authenticated users can insert support_tickets"
  on public.support_tickets for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update support_tickets" on public.support_tickets;
create policy "Authenticated users can update support_tickets"
  on public.support_tickets for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete support_tickets" on public.support_tickets;
create policy "Authenticated users can delete support_tickets"
  on public.support_tickets for delete to authenticated using (true);


-- =============================
-- 4.28: support_replies
-- =============================
alter table public.support_replies enable row level security;

drop policy if exists "Public can select support_replies" on public.support_replies;
create policy "Public can select support_replies"
  on public.support_replies for select to anon using (true);

drop policy if exists "Authenticated users can select support_replies" on public.support_replies;
create policy "Authenticated users can select support_replies"
  on public.support_replies for select to authenticated using (true);

drop policy if exists "Authenticated users can insert support_replies" on public.support_replies;
create policy "Authenticated users can insert support_replies"
  on public.support_replies for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update support_replies" on public.support_replies;
create policy "Authenticated users can update support_replies"
  on public.support_replies for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete support_replies" on public.support_replies;
create policy "Authenticated users can delete support_replies"
  on public.support_replies for delete to authenticated using (true);


-- =============================
-- 4.29: notifications
-- =============================
alter table public.notifications enable row level security;

drop policy if exists "Public can select notifications" on public.notifications;
create policy "Public can select notifications"
  on public.notifications for select to anon using (true);

drop policy if exists "Authenticated users can select notifications" on public.notifications;
create policy "Authenticated users can select notifications"
  on public.notifications for select to authenticated using (true);

drop policy if exists "Authenticated users can insert notifications" on public.notifications;
create policy "Authenticated users can insert notifications"
  on public.notifications for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update notifications" on public.notifications;
create policy "Authenticated users can update notifications"
  on public.notifications for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete notifications" on public.notifications;
create policy "Authenticated users can delete notifications"
  on public.notifications for delete to authenticated using (true);


-- =============================
-- 4.30: audit_logs
-- =============================
alter table public.audit_logs enable row level security;

drop policy if exists "Public can select audit_logs" on public.audit_logs;
create policy "Public can select audit_logs"
  on public.audit_logs for select to anon using (true);

drop policy if exists "Authenticated users can select audit_logs" on public.audit_logs;
create policy "Authenticated users can select audit_logs"
  on public.audit_logs for select to authenticated using (true);

drop policy if exists "Authenticated users can insert audit_logs" on public.audit_logs;
create policy "Authenticated users can insert audit_logs"
  on public.audit_logs for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update audit_logs" on public.audit_logs;
create policy "Authenticated users can update audit_logs"
  on public.audit_logs for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete audit_logs" on public.audit_logs;
create policy "Authenticated users can delete audit_logs"
  on public.audit_logs for delete to authenticated using (true);


-- =============================
-- 4.32: community_comments
-- =============================
alter table public.community_comments enable row level security;

drop policy if exists "Public can select community_comments" on public.community_comments;
create policy "Public can select community_comments"
  on public.community_comments for select to anon using (true);

drop policy if exists "Authenticated users can select community_comments" on public.community_comments;
create policy "Authenticated users can select community_comments"
  on public.community_comments for select to authenticated using (true);

drop policy if exists "Authenticated users can insert community_comments" on public.community_comments;
create policy "Authenticated users can insert community_comments"
  on public.community_comments for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update community_comments" on public.community_comments;
create policy "Authenticated users can update community_comments"
  on public.community_comments for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete community_comments" on public.community_comments;
create policy "Authenticated users can delete community_comments"
  on public.community_comments for delete to authenticated using (true);


-- =============================
-- 4.33: service_provider_breeds
-- =============================
alter table public.service_provider_breeds enable row level security;

drop policy if exists "Public can select service_provider_breeds" on public.service_provider_breeds;
create policy "Public can select service_provider_breeds"
  on public.service_provider_breeds for select to anon using (true);

drop policy if exists "Authenticated users can select service_provider_breeds" on public.service_provider_breeds;
create policy "Authenticated users can select service_provider_breeds"
  on public.service_provider_breeds for select to authenticated using (true);

drop policy if exists "Authenticated users can insert service_provider_breeds" on public.service_provider_breeds;
create policy "Authenticated users can insert service_provider_breeds"
  on public.service_provider_breeds for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update service_provider_breeds" on public.service_provider_breeds;
create policy "Authenticated users can update service_provider_breeds"
  on public.service_provider_breeds for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete service_provider_breeds" on public.service_provider_breeds;
create policy "Authenticated users can delete service_provider_breeds"
  on public.service_provider_breeds for delete to authenticated using (true);


-- =============================
-- 4.34: whats_new
-- =============================
alter table public.whats_new enable row level security;

drop policy if exists "Public can select whats_new" on public.whats_new;
create policy "Public can select whats_new"
  on public.whats_new for select to anon using (true);

drop policy if exists "Authenticated users can select whats_new" on public.whats_new;
create policy "Authenticated users can select whats_new"
  on public.whats_new for select to authenticated using (true);

drop policy if exists "Authenticated users can insert whats_new" on public.whats_new;
create policy "Authenticated users can insert whats_new"
  on public.whats_new for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update whats_new" on public.whats_new;
create policy "Authenticated users can update whats_new"
  on public.whats_new for update to authenticated using (true) with check (true);

drop policy if exists "Authenticated users can delete whats_new" on public.whats_new;
create policy "Authenticated users can delete whats_new"
  on public.whats_new for delete to authenticated using (true);
