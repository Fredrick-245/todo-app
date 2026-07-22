"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markChatRead as markChatReadAction } from "@/actions/chat";
import { roomChatGateway } from "@/lib/room-chat-gateway";
import { createClient } from "@/lib/supabase/client";

export function useUnreadChat(currentUserId: string, chatOpen: boolean) {
  const [unreadCount, setUnreadCount] = useState(0);
  const chatOpenRef = useRef(chatOpen);
  chatOpenRef.current = chatOpen;

  const refreshUnreadCount = useCallback(async () => {
    const supabase = createClient();
    const { data: readState } = await supabase
      .from("chat_reads")
      .select("last_read_at")
      .eq("user_id", currentUserId)
      .maybeSingle();

    const { count, error } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .neq("sender_id", currentUserId)
      .gt(
        "created_at",
        readState?.last_read_at ?? "1970-01-01T00:00:00.000Z",
      );

    if (!error && count !== null) {
      setUnreadCount(count);
    }
  }, [currentUserId]);

  const markChatRead = useCallback(async () => {
    setUnreadCount(0);
    await markChatReadAction();
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (chatOpen) {
      void markChatRead();
    }
  }, [chatOpen, markChatRead]);

  useEffect(() => {
    const disconnect = roomChatGateway.connect();
    const unsubscribe = roomChatGateway.subscribe((message) => {
      if (message.sender_id === currentUserId) return;

      if (chatOpenRef.current) {
        void markChatRead();
        return;
      }

      setUnreadCount((current) => current + 1);
    });

    return () => {
      unsubscribe();
      disconnect();
    };
  }, [currentUserId, markChatRead]);

  return { unreadCount };
}
