create table if not exists public.chat_reads (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_read_at timestamptz not null default now()
);

alter table public.chat_reads enable row level security;

create policy "Users can view their chat read state"
  on public.chat_reads for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can mark chat as read"
  on public.chat_reads for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their chat read state"
  on public.chat_reads for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
