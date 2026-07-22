"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { TodoComment } from "@/lib/types";

export type CommentGatewayEvent = {
  type: "insert" | "delete";
  comment: TodoComment;
};

type CommentListener = (event: CommentGatewayEvent) => void;

class ChatGateway {
  private channel: RealtimeChannel | null = null;
  private todoListeners = new Map<string, Set<CommentListener>>();
  private globalListeners = new Set<CommentListener>();
  private subscriberCount = 0;

  private emit(event: CommentGatewayEvent) {
    this.todoListeners.get(event.comment.todo_id)?.forEach((listener) => {
      listener(event);
    });
    this.globalListeners.forEach((listener) => {
      listener(event);
    });
  }

  private ensureConnected() {
    if (this.channel) return;

    const supabase = createClient();
    this.channel = supabase
      .channel("chat-gateway", {
        config: { broadcast: { self: true } },
      })
      .on("broadcast", { event: "comment:new" }, ({ payload }) => {
        this.emit({ type: "insert", comment: payload as TodoComment });
      })
      .on("broadcast", { event: "comment:delete" }, ({ payload }) => {
        this.emit({ type: "delete", comment: payload as TodoComment });
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "todo_comments",
        },
        (payload) => {
          this.emit({ type: "insert", comment: payload.new as TodoComment });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "todo_comments",
        },
        (payload) => {
          const deleted = payload.old as Partial<TodoComment>;
          if (!deleted.id || !deleted.todo_id) return;
          this.emit({
            type: "delete",
            comment: deleted as TodoComment,
          });
        },
      )
      .subscribe();
  }

  connect() {
    this.subscriberCount++;
    this.ensureConnected();
    return () => {
      this.subscriberCount = Math.max(0, this.subscriberCount - 1);
      if (this.subscriberCount === 0 && this.channel) {
        const supabase = createClient();
        void supabase.removeChannel(this.channel);
        this.channel = null;
        this.todoListeners.clear();
        this.globalListeners.clear();
      }
    };
  }

  subscribeTodo(todoId: string, listener: CommentListener) {
    if (!this.todoListeners.has(todoId)) {
      this.todoListeners.set(todoId, new Set());
    }
    this.todoListeners.get(todoId)!.add(listener);

    return () => {
      this.todoListeners.get(todoId)?.delete(listener);
    };
  }

  subscribeAll(listener: CommentListener) {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  publishComment(comment: TodoComment) {
    this.ensureConnected();
    void this.channel?.send({
      type: "broadcast",
      event: "comment:new",
      payload: comment,
    });
  }
}

export const chatGateway = new ChatGateway();
