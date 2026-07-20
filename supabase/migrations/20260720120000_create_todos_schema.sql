-- Shared todo list for authenticated friends
create type public.todo_priority as enum ('low', 'medium', 'high');

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  label text not null check (char_length(trim(label)) > 0),
  priority public.todo_priority,
  completed boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index todos_completed_created_at_idx on public.todos (completed, created_at desc);

alter table public.todos enable row level security;

create policy "Authenticated users can view todos"
  on public.todos for select
  to authenticated
  using (true);

create policy "Authenticated users can insert todos"
  on public.todos for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can update todos"
  on public.todos for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete todos"
  on public.todos for delete
  to authenticated
  using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger todos_set_updated_at
  before update on public.todos
  for each row
  execute function public.set_updated_at();
