import { AppShell } from "@/components/app-shell";
import { TodosPageContent } from "@/components/todos-page-content";
import type { AppMember } from "@/lib/allowed-users";
import { resolveSelectedMemberId } from "@/lib/members";
import { groupTodosByMember } from "@/lib/todos-cache";
import { getTodayRangeISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Todo } from "@/lib/types";

type TodosPageProps = {
  searchParams: Promise<{ member?: string }>;
};

export default async function TodosPage({ searchParams }: TodosPageProps) {
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
  const memberIds = members.map((member) => member.id);
  const selectedMemberId = resolveSelectedMemberId(
    members,
    memberParam,
    user?.id,
  );

  let initialTodosByMember = groupTodosByMember([], memberIds);

  if (memberIds.length > 0) {
    const { start, end } = getTodayRangeISO();
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .in("created_by", memberIds)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    initialTodosByMember = groupTodosByMember((data ?? []) as Todo[], memberIds);
  }

  return (
    <AppShell>
      {user && selectedMemberId ? (
        <TodosPageContent
          members={members}
          initialTodosByMember={initialTodosByMember}
          selectedMemberId={selectedMemberId}
          currentUserId={user.id}
        />
      ) : null}
    </AppShell>
  );
}
