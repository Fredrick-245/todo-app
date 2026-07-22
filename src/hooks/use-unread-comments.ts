"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { markCommentsRead as markCommentsReadAction } from "@/actions/comments";
import { computeUnreadTodoIds } from "@/lib/comment-reads";
import { createClient } from "@/lib/supabase/client";
import type { Todo } from "@/lib/types";

export function useUnreadComments(
  todos: Todo[],
  expandedTodoIds: Set<string>,
  currentUserId: string,
) {
  const [unreadTodoIds, setUnreadTodoIds] = useState<Set<string>>(() => new Set());

  const imageTodoIds = useMemo(
    () => todos.filter((todo) => todo.image_path).map((todo) => todo.id),
    [todos],
  );
  const imageTodoIdsKey = imageTodoIds.join(",");
  const expandedTodoIdsKey = [...expandedTodoIds].sort().join(",");
  const expandedTodoIdsRef = useRef(expandedTodoIds);
  expandedTodoIdsRef.current = expandedTodoIds;

  const refreshUnread = useCallback(async () => {
    if (imageTodoIds.length === 0) {
      setUnreadTodoIds(new Set());
      return;
    }

    const supabase = createClient();
    const [{ data: comments }, { data: reads }] = await Promise.all([
      supabase
        .from("todo_comments")
        .select("todo_id, author_id, created_at")
        .in("todo_id", imageTodoIds),
      supabase
        .from("todo_comment_reads")
        .select("todo_id, last_read_at")
        .eq("user_id", currentUserId)
        .in("todo_id", imageTodoIds),
    ]);

    setUnreadTodoIds(
      computeUnreadTodoIds(
        imageTodoIds,
        comments ?? [],
        reads ?? [],
        currentUserId,
        expandedTodoIds,
      ),
    );
  }, [currentUserId, expandedTodoIds, imageTodoIds]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread, imageTodoIdsKey, expandedTodoIdsKey]);

  useEffect(() => {
    if (imageTodoIds.length === 0) return;

    const supabase = createClient();
    const channel = supabase
      .channel("todo-comment-unread")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "todo_comments",
        },
        (payload) => {
          const comment = payload.new as {
            todo_id: string;
            author_id: string;
          };

          if (!imageTodoIds.includes(comment.todo_id)) return;
          if (comment.author_id === currentUserId) return;

          if (expandedTodoIdsRef.current.has(comment.todo_id)) {
            void markCommentsReadAction(comment.todo_id);
            return;
          }

          setUnreadTodoIds((current) => {
            if (current.has(comment.todo_id)) return current;
            const next = new Set(current);
            next.add(comment.todo_id);
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, expandedTodoIdsKey, imageTodoIds, imageTodoIdsKey]);

  const markCommentsRead = useCallback(async (todoId: string) => {
    setUnreadTodoIds((current) => {
      if (!current.has(todoId)) return current;
      const next = new Set(current);
      next.delete(todoId);
      return next;
    });

    await markCommentsReadAction(todoId);
  }, []);

  return { unreadTodoIds, markCommentsRead };
}
