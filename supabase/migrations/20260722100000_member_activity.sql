create table if not exists public.member_activity (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.member_activity enable row level security;

create policy "Authenticated users can view member activity"
  on public.member_activity for select
  to authenticated
  using (true);

create policy "Users can record their own activity"
  on public.member_activity for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own activity"
  on public.member_activity for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.member_activity replica identity full;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.member_activity;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
