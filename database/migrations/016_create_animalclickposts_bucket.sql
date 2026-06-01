-- Ensure the shared image bucket exists for image uploads and previews.
insert into storage.buckets (id, name, public)
values ('animalclickposts', 'animalclickposts', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;