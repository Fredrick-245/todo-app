create table if not exists public.todo_comments (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null references public.todos (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (
    char_length(trim(body)) > 0
    and char_length(body) <= 1000
  ),
  created_at timestamptz not null default now()
);

create index if not exists todo_comments_todo_id_created_at_idx
  on public.todo_comments (todo_id, created_at asc);

alter table public.todo_comments enable row level security;

create policy "Authenticated users can view comments"
  on public.todo_comments for select
  to authenticated
  using (true);

create policy "Authenticated users can add comments on todos with images"
  on public.todo_comments for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.todos
      where id = todo_id
        and image_path is not null
    )
  );

create policy "Authors can delete their comments"
  on public.todo_comments for delete
  to authenticated
  using (auth.uid() = author_id);

alter table public.todo_comments replica identity full;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.todo_comments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
