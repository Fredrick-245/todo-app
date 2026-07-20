"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TodoComment } from "@/lib/types";

export function useTodoComments(todoId: string, enabled: boolean) {
  const [comments, setComments] = useState<TodoComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("todo_comments")
      .select("*")
      .eq("todo_id", todoId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data as TodoComment[]);
    }
  }, [todoId]);

  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    void fetchComments().finally(() => setLoading(false));
  }, [enabled, fetchComments]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`todo-comments:${todoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "todo_comments",
          filter: `todo_id=eq.${todoId}`,
        },
        (payload) => {
          const comment = payload.new as TodoComment;
          setComments((current) => {
            if (current.some((item) => item.id === comment.id)) {
              return current;
            }
            return [...current, comment];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "todo_comments",
          filter: `todo_id=eq.${todoId}`,
        },
        (payload) => {
          const deleted = payload.old as Partial<TodoComment>;
          if (!deleted.id) return;
          setComments((current) =>
            current.filter((item) => item.id !== deleted.id),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [todoId, enabled]);

  return { comments, loading };
}
