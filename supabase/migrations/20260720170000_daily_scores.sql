-- Daily scoring for completed todos
alter table public.todos
  add column if not exists completed_at timestamptz;

create table if not exists public.daily_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score_date date not null,
  total_points integer not null default 0 check (total_points >= 0),
  tasks_completed integer not null default 0 check (tasks_completed >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, score_date)
);

create table if not exists public.daily_score_items (
  id uuid primary key default gen_random_uuid(),
  daily_score_id uuid not null references public.daily_scores (id) on delete cascade,
  title text not null,
  label text not null,
  priority public.todo_priority,
  points integer not null check (points >= 0),
  todo_id uuid references public.todos (id) on delete set null
);

create index if not exists daily_scores_user_date_idx
  on public.daily_scores (user_id, score_date desc);

alter table public.daily_scores enable row level security;
alter table public.daily_score_items enable row level security;

create policy "Authenticated users can view daily scores"
  on public.daily_scores for select
  to authenticated
  using (true);

create policy "Authenticated users can view daily score items"
  on public.daily_score_items for select
  to authenticated
  using (true);

create or replace function public.priority_points(priority public.todo_priority)
returns integer
language sql
immutable
set search_path = public
as $$
  select case priority
    when 'high' then 8
    when 'medium' then 5
    when 'low' then 3
    else 3
  end;
$$;

create or replace function public.process_daily_scores()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_date date := (timezone('utc', now()) - interval '1 day')::date;
  member record;
  todo record;
  score_id uuid;
  todo_points integer;
begin
  for member in select id from public.app_members loop
    insert into public.daily_scores (user_id, score_date, total_points, tasks_completed)
    values (member.id, target_date, 0, 0)
    on conflict (user_id, score_date) do update
      set total_points = 0,
          tasks_completed = 0
    returning id into score_id;

    if score_id is null then
      select id into score_id
      from public.daily_scores
      where user_id = member.id and score_date = target_date;
    end if;

    delete from public.daily_score_items where daily_score_id = score_id;

    for todo in
      select *
      from public.todos
      where created_by = member.id
        and completed = true
        and completed_at is not null
        and completed_at >= target_date
        and completed_at < target_date + interval '1 day'
    loop
      todo_points := public.priority_points(todo.priority);

      insert into public.daily_score_items (
        daily_score_id,
        title,
        label,
        priority,
        points,
        todo_id
      )
      values (
        score_id,
        todo.title,
        todo.label,
        todo.priority,
        todo_points,
        todo.id
      );

      update public.daily_scores
      set
        total_points = total_points + todo_points,
        tasks_completed = tasks_completed + 1
      where id = score_id;
    end loop;
  end loop;

  update public.todos
  set completed = false, completed_at = null
  where completed = true;
end;
$$;

-- Schedule in Supabase Dashboard → Database → Extensions → pg_cron, then run:
-- select cron.schedule('daily-todo-scores', '0 0 * * *', $$select public.process_daily_scores();$$);
-- Test manually with: select public.process_daily_scores();
