"use client";

import { TodoListSkeleton } from "@/components/todo-list-skeleton";
import { TodoItem } from "@/components/todo-item";
import { TodosBottomBar } from "@/components/todos-bottom-bar";
import { TodosCacheProvider } from "@/components/todos-cache-context";
import { useTodosCache } from "@/hooks/use-todos-cache";
import type { AppMember } from "@/lib/allowed-users";
import { isCreatedToday } from "@/lib/dates";
import { getMemberLabel } from "@/lib/members";
import type { TodosByMember } from "@/lib/todos-cache";

type TodosPageContentProps = {
  members: AppMember[];
  initialTodosByMember: TodosByMember;
  selectedMemberId: string;
  currentUserId: string;
};

export function TodosPageContent({
  members,
  initialTodosByMember,
  selectedMemberId,
  currentUserId,
}: TodosPageContentProps) {
  const { activeMemberId, activeTodos, showSkeleton, switchMember, refreshMemberIfChanged } =
    useTodosCache({
      members,
      initialTodosByMember,
      selectedMemberId,
    });

  const selectedMember = members.find((member) => member.id === activeMemberId);
  const selectedLabel = selectedMember
    ? getMemberLabel(selectedMember.email)
    : "this member";
  const todaysTodos = activeTodos.filter((todo) => isCreatedToday(todo.created_at));

  return (
    <TodosCacheProvider refreshMember={refreshMemberIfChanged}>
      <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-3">
        {showSkeleton ? (
          <TodoListSkeleton />
        ) : todaysTodos.length === 0 ? (
          <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm ring-1 ring-black/[0.03]">
            <p className="font-medium text-gray-900">No todos for today</p>
            <p className="mt-1 text-sm text-gray-400">
              {selectedMember
                ? `No todos for ${selectedLabel} today. Tap + to add one.`
                : "Add members first, then create todos."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {todaysTodos
              .filter((todo) => !todo.completed)
              .map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  memberId={activeMemberId}
                  currentUserId={currentUserId}
                  members={members}
                />
              ))}

            {todaysTodos.some((todo) => !todo.completed) &&
            todaysTodos.some((todo) => todo.completed) ? (
              <div className="my-2 border-t border-gray-200/80" />
            ) : null}

            {todaysTodos
              .filter((todo) => todo.completed)
              .map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  memberId={activeMemberId}
                  currentUserId={currentUserId}
                  members={members}
                />
              ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-5 pb-6 pt-3">
        <TodosBottomBar
          members={members}
          selectedMemberId={activeMemberId}
          currentUserId={currentUserId}
          onMemberChange={switchMember}
        />
      </div>
      </div>
    </TodosCacheProvider>
  );
}
