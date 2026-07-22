"use client";

import { useCallback, useEffect, useState } from "react";
import { chatGateway } from "@/lib/chat-gateway";
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

    const disconnect = chatGateway.connect();
    const unsubscribe = chatGateway.subscribeTodo(todoId, (event) => {
      if (event.type === "insert") {
        setComments((current) => {
          if (current.some((item) => item.id === event.comment.id)) {
            return current;
          }
          return [...current, event.comment];
        });
        return;
      }

      setComments((current) =>
        current.filter((item) => item.id !== event.comment.id),
      );
    });

    return () => {
      unsubscribe();
      disconnect();
    };
  }, [enabled, todoId]);

  return { comments, loading };
}
