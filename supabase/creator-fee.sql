-- Run this if your creators table exists but is missing the fee column
-- or creator updates (including fee) are not persisting.

alter table public.creators
  add column if not exists fee numeric(15, 2) not null default 0;

-- Required for edit/save to work with the anon key (safe to re-run).
drop policy if exists "Allow public update on creators" on public.creators;
create policy "Allow public update on creators"
  on public.creators for update
  using (true)
  with check (true);

notify pgrst, 'reload schema';
