-- Run in the Supabase SQL Editor to enforce one creator per TikTok username.

create unique index if not exists creators_tiktok_username_unique
  on public.creators (lower(trim(tiktok_username)))
  where tiktok_username is not null and trim(tiktok_username) <> '';

notify pgrst, 'reload schema';
