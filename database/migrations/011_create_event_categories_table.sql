-- Create event_categories table
create table if not exists public.event_categories (
  event_category_id bigint generated always as identity not null,
  name text not null,
  description text null,
  icon text null,
  color text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null default now(),
  constraint event_categories_pkey primary key (event_category_id)
) tablespace pg_default;

create index if not exists idx_event_categories_name on public.event_categories (name);
