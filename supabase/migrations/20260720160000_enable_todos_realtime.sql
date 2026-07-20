alter table public.todos replica identity full;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
