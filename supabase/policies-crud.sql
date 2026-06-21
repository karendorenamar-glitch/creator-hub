-- Run this if you already created tables but need update/delete policies for CRUD.

create policy "Allow public update on creators"
  on public.creators for update
  using (true)
  with check (true);

create policy "Allow public delete on creators"
  on public.creators for delete
  using (true);

create policy "Allow public insert on videos"
  on public.videos for insert
  with check (true);

create policy "Allow public update on videos"
  on public.videos for update
  using (true)
  with check (true);

create policy "Allow public delete on videos"
  on public.videos for delete
  using (true);
