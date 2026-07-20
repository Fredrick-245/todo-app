import { TodosBottomBar } from "@/components/todos-bottom-bar";
import { SignOutButton } from "@/components/sign-out-button";
import { TodoItem } from "@/components/todo-item";
import type { AppMember } from "@/lib/allowed-users";
import { getMemberLabel, resolveSelectedMemberId } from "@/lib/members";
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
  const selectedMemberId = resolveSelectedMemberId(
    members,
    memberParam,
    user?.id,
  );

  let todos: Todo[] = [];

  if (selectedMemberId) {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("created_by", selectedMemberId)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    todos = (data ?? []) as Todo[];
  }

  const active = todos.filter((todo) => !todo.completed);
  const completed = todos.filter((todo) => todo.completed);
  const selectedMember = members.find((member) => member.id === selectedMemberId);
  const selectedLabel = selectedMember
    ? getMemberLabel(selectedMember.email)
    : "this member";

  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-lg bg-slate-50 px-5 pb-28 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Todos
        </h1>
        <SignOutButton />
      </header>

      {todos.length === 0 ? (
        <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm ring-1 ring-black/[0.03]">
          <p className="font-medium text-gray-900">No todos yet</p>
          <p className="mt-1 text-sm text-gray-400">
            {selectedMember
              ? `No todos for ${selectedLabel}. Tap + to add one.`
              : "Add members first, then create todos."}
          </p>
        </div>
      ) : user ? (
        <div className="flex flex-col gap-3">
          {active.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              memberId={selectedMemberId!}
              currentUserId={user.id}
            />
          ))}

          {active.length > 0 && completed.length > 0 ? (
            <div className="my-2 border-t border-gray-200/80" />
          ) : null}

          {completed.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              memberId={selectedMemberId!}
              currentUserId={user.id}
            />
          ))}
        </div>
      ) : null}

      {selectedMemberId ? (
        <TodosBottomBar
          members={members}
          selectedMemberId={selectedMemberId}
        />
      ) : null}
    </main>
  );
}
