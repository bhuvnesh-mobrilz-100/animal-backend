-- Create a security definer function to upsert storage buckets.
-- This avoids needing to expose the storage schema to PostgREST.
create or replace function create_storage_bucket(bucket_id text, bucket_name text, is_public boolean)
returns void
language plpgsql
security definer
as $$
begin
  insert into storage.buckets (id, name, public)
  values (bucket_id, bucket_name, is_public)
  on conflict (id) do update
  set name = excluded.name,
      public = excluded.public;
end;
$$;
