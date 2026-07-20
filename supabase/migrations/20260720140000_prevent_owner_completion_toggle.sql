create or replace function public.prevent_owner_completing_own_todo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.created_by = auth.uid()
     and new.completed is distinct from old.completed then
    raise exception 'Only your friend can change completion on your todos';
  end if;
  return new;
end;
$$;

drop trigger if exists todos_prevent_owner_completion on public.todos;

create trigger todos_prevent_owner_completion
  before update on public.todos
  for each row
  execute function public.prevent_owner_completing_own_todo();
