"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AppMember } from "@/lib/allowed-users";
import { createClient } from "@/lib/supabase/client";
import { getTodayRangeISO } from "@/lib/dates";
import {
  mergeTodosByMember,
  sortTodos,
  todosEqual,
  type TodosByMember,
} from "@/lib/todos-cache";
import type { Todo } from "@/lib/types";

type UseTodosCacheOptions = {
  members: AppMember[];
  initialTodosByMember: TodosByMember;
  selectedMemberId: string;
};

export function useTodosCache({
  members,
  initialTodosByMember,
  selectedMemberId,
}: UseTodosCacheOptions) {
  const memberIds = useMemo(
    () => members.map((member) => member.id),
    [members],
  );
  const memberIdsKey = memberIds.join(",");
  const [activeMemberId, setActiveMemberId] = useState(selectedMemberId);
  const [todosByMember, setTodosByMember] =
    useState<TodosByMember>(initialTodosByMember);
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);

  useEffect(() => {
    setActiveMemberId(selectedMemberId);
  }, [selectedMemberId]);

  useEffect(() => {
    setTodosByMember((current) =>
      mergeTodosByMember(current, initialTodosByMember),
    );
  }, [initialTodosByMember]);

  const fetchMemberTodos = useCallback(async (memberId: string) => {
    const supabase = createClient();
    const { start, end } = getTodayRangeISO();
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("created_by", memberId)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data) {
      return;
    }

    const sorted = sortTodos(data as Todo[]);

    setTodosByMember((current) => {
      const existing = current[memberId] ?? [];

      if (todosEqual(existing, sorted)) {
        return current;
      }

      return { ...current, [memberId]: sorted };
    });
  }, []);

  const refreshMemberIfChanged = useCallback(
    async (memberId: string, showLoading = false) => {
      const hasCachedTodos = (todosByMember[memberId]?.length ?? 0) > 0;

      if (showLoading && !hasCachedTodos) {
        setLoadingMemberId(memberId);
      }

      await fetchMemberTodos(memberId);
      setLoadingMemberId((current) => (current === memberId ? null : current));
    },
    [fetchMemberTodos, todosByMember],
  );

  const switchMember = useCallback(
    (memberId: string) => {
      if (memberId === activeMemberId) return;

      setActiveMemberId(memberId);
      window.history.replaceState(null, "", `/todos?member=${memberId}`);
      void refreshMemberIfChanged(memberId);
    },
    [activeMemberId, refreshMemberIfChanged],
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("todos-cache")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deleted = payload.old as Partial<Todo>;
            const memberId = deleted.created_by;

            if (!memberId) {
              void Promise.all(memberIds.map((id) => fetchMemberTodos(id)));
              return;
            }

            setTodosByMember((current) => ({
              ...current,
              [memberId]: sortTodos(
                (current[memberId] ?? []).filter((todo) => todo.id !== deleted.id),
              ),
            }));
            return;
          }

          const todo = payload.new as Todo;
          if (!todo.created_by) return;

          const { start, end } = getTodayRangeISO();
          const createdAt = new Date(todo.created_at).getTime();
          const inTodayRange =
            createdAt >= new Date(start).getTime() &&
            createdAt < new Date(end).getTime();

          setTodosByMember((current) => {
            const existing = current[todo.created_by!] ?? [];
            const index = existing.findIndex((item) => item.id === todo.id);

            if (!inTodayRange) {
              if (index < 0) return current;
              return {
                ...current,
                [todo.created_by!]: sortTodos(
                  existing.filter((item) => item.id !== todo.id),
                ),
              };
            }

            const next =
              index >= 0
                ? existing.map((item, itemIndex) =>
                    itemIndex === index ? (todo as Todo) : item,
                  )
                : [...existing, todo as Todo];

            return {
              ...current,
              [todo.created_by!]: sortTodos(next),
            };
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchMemberTodos, memberIds, memberIdsKey]);

  const activeTodos = todosByMember[activeMemberId] ?? [];
  const showSkeleton =
    loadingMemberId === activeMemberId && activeTodos.length === 0;

  return {
    activeMemberId,
    activeTodos,
    showSkeleton,
    switchMember,
    refreshMemberIfChanged,
  };
}
