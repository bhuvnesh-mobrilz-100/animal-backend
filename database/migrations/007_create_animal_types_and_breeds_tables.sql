-- Create animal_types and breeds tables
create table if not exists public.animal_types (
  animal_type_id bigint generated always as identity not null,
  name text not null,
  image_url text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint animal_types_pkey primary key (animal_type_id)
) tablespace pg_default;

create table if not exists public.breeds (
  breed_id bigint generated always as identity not null,
  name text not null,
  description text null,
  image_url text null,
  animal_type_id bigint null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint breeds_pkey primary key (breed_id),
  constraint breeds_animal_type_id_fkey foreign key (animal_type_id) references public.animal_types(animal_type_id)
) tablespace pg_default;

create index if not exists idx_animal_types_name on public.animal_types (name);
create index if not exists idx_breeds_name on public.breeds (name);
create index if not exists idx_breeds_animal_type_id on public.breeds (animal_type_id);
