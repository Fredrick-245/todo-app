import { redirect } from "next/navigation";
import { createTodo } from "@/actions/todos";
import { TodoForm } from "@/components/todo-form";
import type { AppMember } from "@/lib/allowed-users";
import { resolveSelectedMemberId } from "@/lib/members";
import { createClient } from "@/lib/supabase/server";

type NewTodoPageProps = {
  searchParams: Promise<{ member?: string }>;
};

export default async function NewTodoPage({ searchParams }: NewTodoPageProps) {
  const { member: memberParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membersData } = await supabase
    .from("app_members")
    .select("id, email, created_at")
    .order("created_at", { ascending: true });

  const members = (membersData ?? []) as AppMember[];
  const ownerId = resolveSelectedMemberId(members, memberParam, user?.id);

  if (!ownerId) {
    redirect("/todos");
  }

  return (
    <TodoForm
      title="Add Todo"
      action={createTodo}
      ownerId={ownerId}
      cancelHref={`/todos?member=${ownerId}`}
    />
  );
}
