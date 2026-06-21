-- Run in the Supabase SQL Editor to prevent duplicate creators by name + contact.

alter table public.creators
  drop constraint if exists creators_username_key;

drop index if exists public.creators_name_contact_unique;

create unique index creators_name_contact_unique
  on public.creators (
    lower(trim(name)),
    lower(trim(coalesce(contact, '')))
  );

notify pgrst, 'reload schema';
