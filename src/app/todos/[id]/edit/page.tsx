import { notFound, redirect } from "next/navigation";
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
    .select("created_by")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const todo = data as Pick<Todo, "created_by">;
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

  redirect(`/todos?member=${ownerId ?? ""}`);
}
