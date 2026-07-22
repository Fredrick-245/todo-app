"use client";

import { useCallback, useEffect, useState } from "react";
import { roomChatGateway } from "@/lib/room-chat-gateway";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/types";

export function useRoomChat(enabled: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data as ChatMessage[]);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    setLoading(true);
    void fetchMessages().finally(() => setLoading(false));
  }, [enabled, fetchMessages]);

  useEffect(() => {
    if (!enabled) return;

    const disconnect = roomChatGateway.connect();
    const unsubscribe = roomChatGateway.subscribe((message) => {
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) {
          return current;
        }
        return [...current, message];
      });
    });

    return () => {
      unsubscribe();
      disconnect();
    };
  }, [enabled]);

  return { messages, loading };
}
