-- Kefoo Wedding Planner - 007: inspiration image uploads.
-- Run SEVENTH, after 001-006. Safe to re-run. Non-destructive.

-- 1. Category becomes free text (suggestions live in the UI only).
alter table public.inspiration_items
  drop constraint if exists inspiration_items_category_check;
alter table public.inspiration_items alter column category set default '';
alter table public.inspiration_items alter column category drop not null;

-- 2. Uploaded file path (image_url stays for legacy external links).
alter table public.inspiration_items
  add column if not exists image_path text
  check (image_path is null or char_length(image_path) <= 500);

-- 3. Private bucket for uploaded inspiration photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inspiration-images',
  'inspiration-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 4. Storage policies: path is "<wedding_id>/<file>".
drop policy if exists "Wedding members read inspiration images" on storage.objects;
create policy "Wedding members read inspiration images" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'inspiration-images'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Wedding members upload inspiration images" on storage.objects;
create policy "Wedding members upload inspiration images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'inspiration-images'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "Wedding members delete inspiration images" on storage.objects;
create policy "Wedding members delete inspiration images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'inspiration-images'
    and public.is_wedding_member(((storage.foldername(name))[1])::uuid)
  );

notify pgrst, 'reload schema';
