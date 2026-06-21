-- Run in the Supabase SQL Editor to add the TikTok username field.

alter table public.creators
  add column if not exists username text;

notify pgrst, 'reload schema';
