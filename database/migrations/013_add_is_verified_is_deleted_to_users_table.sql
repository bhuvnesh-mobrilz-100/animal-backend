-- Add is_verified and is_deleted columns to users table
alter table public.users
  add column if not exists is_verified boolean not null default false;

alter table public.users
  add column if not exists is_deleted boolean not null default false;

create index if not exists idx_users_is_deleted on public.users (is_deleted);
create index if not exists idx_users_is_verified on public.users (is_verified);
