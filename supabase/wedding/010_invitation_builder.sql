-- Kefoo Wedding Planner - 010: invitation builder (templates, design, media, music).
-- Run TENTH, after 009. Safe to re-run. ADDITIVE: no existing rows are deleted.

-- 1. Extend invitations with builder fields.
alter table public.invitations
  add column if not exists design jsonb not null default '{}'::jsonb,
  add column if not exists music_mode text not null default 'none',
  add column if not exists music_track_id text,
  add column if not exists music_path text,
  add column if not exists music_volume integer not null default 60,
  add column if not exists cover_path text,
  add column if not exists couple_path text;

alter table public.invitations drop constraint if exists invitations_music_mode_check;
alter table public.invitations
  add constraint invitations_music_mode_check
  check (music_mode in ('none', 'library', 'upload'));

alter table public.invitations drop constraint if exists invitations_music_volume_check;
alter table public.invitations
  add constraint invitations_music_volume_check
  check (music_volume between 0 and 100);

-- 2. Template keys: elegant | garden | luxury. Unknown legacy values map to elegant.
alter table public.invitations drop constraint if exists invitations_template_check;
update public.invitations
set template = 'elegant'
where template not in ('elegant', 'garden', 'luxury');
alter table public.invitations
  add constraint invitations_template_check
  check (template in ('elegant', 'garden', 'luxury'));

-- 3. Music catalogue metadata only. No audio is shipped: audio_url stays null
--    and is_available = false until a verified licensed asset is added.
create table if not exists public.music_tracks (
  id text primary key,
  title text not null,
  mood text not null,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  license text not null default 'Belum tersedia (menunggu aset berlisensi)',
  license_url text,
  audio_url text,
  is_available boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.music_tracks (id, title, mood, duration_seconds, is_available, sort_order)
values
  ('romantic-strings', 'Romantic Strings', 'romantis / instrumental', 180, false, 1),
  ('soft-piano', 'Soft Piano', 'lembut / klasik', 210, false, 2),
  ('garden-breeze', 'Garden Breeze', 'akustik / tenang', 195, false, 3),
  ('modern-love', 'Modern Love', 'kontemporer / hangat', 200, false, 4)
on conflict (id) do nothing;

alter table public.music_tracks enable row level security;

drop policy if exists "Anyone reads music catalogue" on public.music_tracks;
create policy "Anyone reads music catalogue" on public.music_tracks
  for select to anon, authenticated using (true);

revoke all on public.music_tracks from anon, authenticated;
grant select on public.music_tracks to anon, authenticated;

-- 4. Storage buckets for uploaded media.
--    Paths are always "<wedding_id>/<random>.<ext>" and therefore unguessable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('invitation-photos', 'invitation-photos', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('invitation-audio', 'invitation-audio', true, 10485760,
    array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/x-m4a'])
on conflict (id) do nothing;

-- 5. Only wedding members may write into the invitation buckets.
drop policy if exists "Members upload invitation media" on storage.objects;
create policy "Members upload invitation media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('invitation-photos', 'invitation-audio')
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Members update invitation media" on storage.objects;
create policy "Members update invitation media" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('invitation-photos', 'invitation-audio')
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Members delete invitation media" on storage.objects;
create policy "Members delete invitation media" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('invitation-photos', 'invitation-audio')
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

-- 6. Public RPC must expose the new builder fields. Return type changes,
--    so the old function is dropped and recreated (no data touched).
drop function if exists public.get_public_invitation(text);

create function public.get_public_invitation(p_slug text)
returns table (
  id uuid,
  wedding_id uuid,
  content jsonb,
  design jsonb,
  template text,
  music_mode text,
  music_track_id text,
  music_path text,
  music_volume integer,
  cover_path text,
  couple_path text,
  published_at timestamptz,
  partner_one_name text,
  partner_two_name text,
  wedding_date date,
  location text
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, i.wedding_id, i.content, i.design, i.template,
         i.music_mode, i.music_track_id, i.music_path, i.music_volume,
         i.cover_path, i.couple_path, i.published_at,
         w.partner_one_name, w.partner_two_name, w.wedding_date, w.location
  from public.invitations i
  join public.weddings w on w.id = i.wedding_id
  where i.slug = lower(p_slug)
    and i.status = 'published'
  limit 1;
$$;

revoke all on function public.get_public_invitation(text) from public;
grant execute on function public.get_public_invitation(text) to anon, authenticated;

notify pgrst, 'reload schema';
