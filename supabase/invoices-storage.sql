-- Create invoices storage bucket and policies.
-- Run in Supabase SQL editor if the bucket does not exist yet.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invoices',
  'invoices',
  true,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Allow public read on invoice files"
  on storage.objects for select
  using (bucket_id = 'invoices');

create policy "Allow public upload on invoice files"
  on storage.objects for insert
  with check (bucket_id = 'invoices');

create policy "Allow public update on invoice files"
  on storage.objects for update
  using (bucket_id = 'invoices')
  with check (bucket_id = 'invoices');

create policy "Allow public delete on invoice files"
  on storage.objects for delete
  using (bucket_id = 'invoices');
