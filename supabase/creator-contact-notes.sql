-- Run this to replace email/avatar_url with contact/notes on existing databases.

alter table public.creators
  add column if not exists contact text;

alter table public.creators
  add column if not exists notes text;

update public.creators
set contact = email
where (contact is null or trim(contact) = '')
  and email is not null
  and trim(email) != '';

alter table public.creators
  drop column if exists email;

alter table public.creators
  drop column if exists avatar_url;

notify pgrst, 'reload schema';
