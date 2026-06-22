-- Add platform-specific usernames and migrate legacy username data.

alter table public.creators
  add column if not exists tiktok_username text,
  add column if not exists instagram_username text,
  add column if not exists threads_username text;

update public.creators
set tiktok_username = nullif(
  lower(trim(regexp_replace(username, '^@+', '', 'i'))),
  ''
)
where tiktok_username is null
  and username is not null
  and trim(username) <> '';

alter table public.creators
  drop column if exists username;

notify pgrst, 'reload schema';
