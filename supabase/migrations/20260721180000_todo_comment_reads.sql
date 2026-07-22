create table if not exists public.todo_comment_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  todo_id uuid not null references public.todos (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, todo_id)
);

create index if not exists todo_comment_reads_todo_id_idx
  on public.todo_comment_reads (todo_id);

alter table public.todo_comment_reads enable row level security;

create policy "Users can view their comment read state"
  on public.todo_comment_reads for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can mark comments read"
  on public.todo_comment_reads for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their comment read state"
  on public.todo_comment_reads for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
