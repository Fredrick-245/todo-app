"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/types";

type RoomChatListener = (message: ChatMessage) => void;

class RoomChatGateway {
  private channel: RealtimeChannel | null = null;
  private listeners = new Set<RoomChatListener>();
  private subscriberCount = 0;

  private ensureConnected() {
    if (this.channel) return;

    const supabase = createClient();
    this.channel = supabase
      .channel("room-chat-gateway", {
        config: { broadcast: { self: true } },
      })
      .on("broadcast", { event: "message:new" }, ({ payload }) => {
        this.listeners.forEach((listener) => {
          listener(payload as ChatMessage);
        });
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload) => {
          this.listeners.forEach((listener) => {
            listener(payload.new as ChatMessage);
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
        this.listeners.clear();
      }
    };
  }

  subscribe(listener: RoomChatListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  publishMessage(message: ChatMessage) {
    this.ensureConnected();
    void this.channel?.send({
      type: "broadcast",
      event: "message:new",
      payload: message,
    });
  }
}

export const roomChatGateway = new RoomChatGateway();
