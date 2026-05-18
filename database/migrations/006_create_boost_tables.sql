-- Create boost_packages table
create table public.boost_packages (
  boost_package_id bigint generated always as identity not null,
  name text not null,
  description text null,
  duration_days integer not null default 0,
  price numeric(10,2) not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint boost_packages_pkey primary key (boost_package_id)
) TABLESPACE pg_default;

-- Create entity_boosts table
create table public.entity_boosts (
  entity_boost_id bigint generated always as identity not null,
  vet_id bigint null,
  breeder_id bigint null,
  pet_friendly_place_id bigint null,
  service_provider_id bigint null,
  user_id bigint not null,
  package_id bigint not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint entity_boosts_pkey primary key (entity_boost_id)
) TABLESPACE pg_default;

alter table public.entity_boosts
  add constraint entity_boosts_package_id_fkey foreign key (package_id) references public.boost_packages(boost_package_id);
