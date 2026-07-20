alter table public.todos
  add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'todo-images',
  'todo-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Authenticated users can upload todo images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'todo-images');

create policy "Authenticated users can view todo images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'todo-images');

create policy "Authenticated users can update todo images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'todo-images')
  with check (bucket_id = 'todo-images');

create policy "Authenticated users can delete todo images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'todo-images');
