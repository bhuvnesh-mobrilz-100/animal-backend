-- Create events table
create table if not exists public.events (
  event_id bigint generated always as identity not null,
  service_provider_id bigint null,
  title text not null,
  description text null,
  event_date timestamp with time zone not null,
  end_date timestamp with time zone null,
  location_id bigint null,
  image_url text null,
  price numeric(10,2) null,
  max_attendees integer null,
  current_attendees integer not null default 0,
  is_active boolean not null default true,
  event_category_id bigint null,
  additional_info jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint events_pkey primary key (event_id)
) tablespace pg_default;

alter table public.events
  add constraint events_service_provider_id_fkey foreign key (service_provider_id) references public.service_providers(service_provider_id);

alter table public.events
  add constraint events_location_id_fkey foreign key (location_id) references public.locations(location_id);

alter table public.events
  add constraint events_event_category_id_fkey foreign key (event_category_id) references public.event_categories(event_category_id);

create index if not exists idx_events_service_provider_id on public.events (service_provider_id);
create index if not exists idx_events_location_id on public.events (location_id);
create index if not exists idx_events_event_category_id on public.events (event_category_id);
create index if not exists idx_events_event_date on public.events (event_date);
