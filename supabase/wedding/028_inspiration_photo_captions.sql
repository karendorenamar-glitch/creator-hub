-- Kefoo Wedding Planner - 028: optional caption/info per inspiration photo.
-- Additive and non-destructive. Existing photos stay visible.
--
-- Examples: "Dinner chair", "Welcome board", "Table decor".

alter table public.inspiration_photos
  add column if not exists caption text;

alter table public.inspiration_photos
  drop constraint if exists inspiration_photos_caption_check;

alter table public.inspiration_photos
  add constraint inspiration_photos_caption_check
  check (caption is null or char_length(caption) <= 120);

notify pgrst, 'reload schema';
