import { notFound, redirect } from "next/navigation";
import { updateTodo } from "@/actions/todos";
import { TodoForm } from "@/components/todo-form";
import type { AppMember } from "@/lib/allowed-users";
import { resolveSelectedMemberId } from "@/lib/members";
import { createClient } from "@/lib/supabase/server";
import type { Todo } from "@/lib/types";

type EditTodoPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ member?: string }>;
};

export default async function EditTodoPage({
  params,
  searchParams,
}: EditTodoPageProps) {
  const { id } = await params;
  const { member: memberParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const todo = data as Todo;
  const { data: membersData } = await supabase
    .from("app_members")
    .select("id, email, created_at")
    .order("created_at", { ascending: true });

  const members = (membersData ?? []) as AppMember[];
  const ownerId =
    resolveSelectedMemberId(
      members,
      memberParam ?? todo.created_by ?? undefined,
      user?.id,
    ) ?? todo.created_by;

  if (!ownerId || todo.created_by !== user?.id) {
    redirect(`/todos?member=${todo.created_by ?? ownerId ?? ""}`);
  }

  const action = updateTodo.bind(null, todo.id);

  return (
    <TodoForm
      title="Edit Todo"
      todo={todo}
      action={action}
      ownerId={ownerId}
      cancelHref={`/todos?member=${ownerId}`}
    />
  );
}
