create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (
    char_length(trim(body)) > 0
    and char_length(body) <= 2000
  ),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_created_at_idx
  on public.chat_messages (created_at asc);

alter table public.chat_messages enable row level security;

create policy "Authenticated users can view chat messages"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_members
      where id = auth.uid()
    )
  );

create policy "Authenticated users can send chat messages"
  on public.chat_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.app_members
      where id = auth.uid()
    )
  );

alter table public.chat_messages replica identity full;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
