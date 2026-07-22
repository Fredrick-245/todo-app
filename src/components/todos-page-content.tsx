"use client";

import { useCallback, useEffect, useState } from "react";
import { MemberPresenceLabel } from "@/components/member-presence-label";
import { TodoFormModal } from "@/components/todo-form-modal";
import { TodoListSkeleton } from "@/components/todo-list-skeleton";
import { TodoItem } from "@/components/todo-item";
import { TodosBottomBar } from "@/components/todos-bottom-bar";
import { TodosCacheProvider } from "@/components/todos-cache-context";
import { TodosHeaderActions } from "@/components/todos-header-actions";
import { useMemberPresence } from "@/hooks/use-member-presence";
import { useTodosCache } from "@/hooks/use-todos-cache";
import { useUnreadComments } from "@/hooks/use-unread-comments";
import { chatGateway } from "@/lib/chat-gateway";
import type { AppMember } from "@/lib/allowed-users";
import { getMemberLabel } from "@/lib/members";
import type { TodosByMember } from "@/lib/todos-cache";
import type { Todo } from "@/lib/types";

type TodoFormModalState =
  | { mode: "add" }
  | { mode: "edit"; todo: Todo }
  | null;

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

  // Keep expanded state in the parent so realtime cache updates / re-sorts can
  // never collapse an open todo (e.g. while someone is typing a comment).
  const [expandedTodoIds, setExpandedTodoIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [formModal, setFormModal] = useState<TodoFormModalState>(null);

  const { unreadTodoIds, markCommentsRead } = useUnreadComments(
    activeTodos,
    expandedTodoIds,
    currentUserId,
  );

  const { isOnline, statusLabel } = useMemberPresence(members, currentUserId);

  useEffect(() => {
    const disconnect = chatGateway.connect();
    return disconnect;
  }, []);

  const handleExpandedChange = useCallback(
    (todoId: string, value: boolean | ((prev: boolean) => boolean)) => {
      setExpandedTodoIds((current) => {
        const wasExpanded = current.has(todoId);
        const next = typeof value === "function" ? value(wasExpanded) : value;
        if (next === wasExpanded) return current;

        if (next) {
          void markCommentsRead(todoId);
        }

        const updated = new Set(current);
        if (next) {
          updated.add(todoId);
        } else {
          updated.delete(todoId);
        }
        return updated;
      });
    },
    [markCommentsRead],
  );

  const handleFormSuccess = useCallback(() => {
    setFormModal(null);
    void refreshMemberIfChanged(activeMemberId);
  }, [activeMemberId, refreshMemberIfChanged]);

  return (
    <TodosCacheProvider refreshMember={refreshMemberIfChanged}>
      <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between px-4 pb-3 pt-6 sm:px-5 sm:pb-4 sm:pt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Todos
          </h1>
          <MemberPresenceLabel isOnline={isOnline} statusLabel={statusLabel} />
        </div>
        <TodosHeaderActions
          memberId={activeMemberId}
          currentUserId={currentUserId}
        />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 sm:px-5">
        {showSkeleton ? (
          <TodoListSkeleton />
        ) : activeTodos.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-8 text-center shadow-sm ring-1 ring-black/[0.03] sm:px-5 sm:py-10">
            <p className="text-sm font-medium text-gray-900 sm:text-base">
              No todos for today
            </p>
            <p className="mt-1 text-xs text-gray-400 sm:text-sm">
              {selectedMember
                ? `No todos for ${selectedLabel} today. Tap + to add one.`
                : "Add members first, then create todos."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeTodos
              .filter((todo) => !todo.completed)
              .map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  memberId={activeMemberId}
                  currentUserId={currentUserId}
                  members={members}
                  expanded={expandedTodoIds.has(todo.id)}
                  hasUnreadComments={unreadTodoIds.has(todo.id)}
                  onExpandedChange={(value) => handleExpandedChange(todo.id, value)}
                  onEdit={
                    todo.created_by === currentUserId
                      ? (item) => setFormModal({ mode: "edit", todo: item })
                      : undefined
                  }
                />
              ))}

            {activeTodos.some((todo) => !todo.completed) &&
            activeTodos.some((todo) => todo.completed) ? (
              <div className="my-2 border-t border-gray-200/80" />
            ) : null}

            {activeTodos
              .filter((todo) => todo.completed)
              .map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  memberId={activeMemberId}
                  currentUserId={currentUserId}
                  members={members}
                  expanded={expandedTodoIds.has(todo.id)}
                  hasUnreadComments={unreadTodoIds.has(todo.id)}
                  onExpandedChange={(value) => handleExpandedChange(todo.id, value)}
                  onEdit={
                    todo.created_by === currentUserId
                      ? (item) => setFormModal({ mode: "edit", todo: item })
                      : undefined
                  }
                />
              ))}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2 sm:px-5 sm:pb-6 sm:pt-3">
        <TodosBottomBar
          members={members}
          selectedMemberId={activeMemberId}
          onMemberChange={switchMember}
          onAddTodo={() => setFormModal({ mode: "add" })}
        />
      </div>
      </div>

      <TodoFormModal
        open={formModal !== null}
        mode={formModal?.mode ?? "add"}
        ownerId={currentUserId}
        todo={formModal?.mode === "edit" ? formModal.todo : undefined}
        onClose={() => setFormModal(null)}
        onSuccess={handleFormSuccess}
      />
    </TodosCacheProvider>
  );
}
