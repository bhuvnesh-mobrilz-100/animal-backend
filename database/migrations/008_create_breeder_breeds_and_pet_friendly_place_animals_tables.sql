-- Create breeder_breeds and pet_friendly_place_animals tables
create table if not exists public.breeder_breeds (
  breeder_breed_id bigint generated always as identity not null,
  breeder_id bigint not null,
  breed_id bigint not null,
  service_provider_id bigint null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint breeder_breeds_pkey primary key (breeder_breed_id),
  constraint breeder_breeds_breeder_id_fkey foreign key (breeder_id) references public.breeders(breeder_id),
  constraint breeder_breeds_breed_id_fkey foreign key (breed_id) references public.breeds(breed_id),
  constraint breeder_breeds_service_provider_id_fkey foreign key (service_provider_id) references public.service_providers(service_provider_id)
) tablespace pg_default;

create index if not exists idx_breeder_breeds_breeder_id on public.breeder_breeds (breeder_id);
create index if not exists idx_breeder_breeds_breed_id on public.breeder_breeds (breed_id);
create index if not exists idx_breeder_breeds_service_provider_id on public.breeder_breeds (service_provider_id);

create table if not exists public.pet_friendly_place_animals (
  pet_friendly_place_animal_id bigint generated always as identity not null,
  pet_friendly_place_id bigint not null,
  animal_type_id bigint not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint pet_friendly_place_animals_pkey primary key (pet_friendly_place_animal_id),
  constraint pet_friendly_place_animals_pet_friendly_place_id_fkey foreign key (pet_friendly_place_id) references public.pet_friendly_places(pet_friendly_place_id),
  constraint pet_friendly_place_animals_animal_type_id_fkey foreign key (animal_type_id) references public.animal_types(animal_type_id)
) tablespace pg_default;

create index if not exists idx_pet_friendly_place_animals_place_id on public.pet_friendly_place_animals (pet_friendly_place_id);
create index if not exists idx_pet_friendly_place_animals_animal_type_id on public.pet_friendly_place_animals (animal_type_id);
