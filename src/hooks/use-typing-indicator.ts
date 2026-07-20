"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TypingPayload = {
  userId: string;
  name: string;
};

export function useTypingIndicator(
  todoId: string,
  enabled: boolean,
  userId: string,
  userName: string,
) {
  const [typingName, setTypingName] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setTypingName(null);
      return;
    }

    const supabase = createClient();
    const channel = supabase.channel(`todo-typing:${todoId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { userId: typingUserId, name } = payload as TypingPayload;

        if (typingUserId === userId) return;

        setTypingName(name);

        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }

        hideTimeoutRef.current = setTimeout(() => {
          setTypingName(null);
        }, 3000);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [todoId, enabled, userId]);

  const notifyTyping = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId, name: userName } satisfies TypingPayload,
    });
  }, [userId, userName]);

  return { typingName, notifyTyping };
}
