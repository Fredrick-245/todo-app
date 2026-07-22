"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, MessageCircle, Send, X } from "lucide-react";
import { sendChatMessage } from "@/actions/chat";
import { useRoomChat } from "@/hooks/use-room-chat";
import type { AppMember } from "@/lib/allowed-users";
import { getMemberLabel } from "@/lib/members";
import { roomChatGateway } from "@/lib/room-chat-gateway";
import type { ChatMessage } from "@/lib/types";

type ChatButtonProps = {
  members: AppMember[];
  currentUserId: string;
};

function formatMessageTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDateKey(createdAt: string): string {
  return new Date(createdAt).toDateString();
}

function formatDateLabel(dateKey: string): string {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

type MessageGroup = {
  dateKey: string;
  items: ChatMessage[];
};

function groupMessagesByDate(messages: ChatMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const message of messages) {
    const dateKey = getDateKey(message.created_at);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.dateKey === dateKey) {
      lastGroup.items.push(message);
    } else {
      groups.push({ dateKey, items: [message] });
    }
  }

  return groups;
}

export function ChatButton({ members, currentUserId }: ChatButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading } = useRoomChat(open);

  const otherMember = useMemo(
    () => members.find((member) => member.id !== currentUserId) ?? null,
    [members, currentUserId],
  );
  const otherLabel = otherMember
    ? getMemberLabel(otherMember.email)
    : "Chat";

  const messageGroups = useMemo(
    () => groupMessagesByDate(messages),
    [messages],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages]);

  const handleSend = () => {
    const trimmed = body.trim();
    if (!trimmed || isSending) return;

    setError(null);
    startTransition(async () => {
      const result = await sendChatMessage(trimmed);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.message) {
        roomChatGateway.publishMessage(result.message);
      }

      setBody("");
    });
  };

  const modal =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 sm:items-center sm:justify-center sm:bg-black/25 sm:p-4">
            <div className="flex h-dvh w-full max-w-lg flex-col overflow-hidden bg-slate-100 sm:h-[92dvh] sm:rounded-2xl sm:shadow-xl sm:ring-1 sm:ring-black/[0.05]">
              <div className="flex shrink-0 items-center gap-3 border-b border-gray-200/80 bg-white px-3 py-3 sm:px-4">
                <button
                  type="button"
                  aria-label="Close chat"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 sm:hidden"
                >
                  <ArrowLeft className="h-5 w-5" strokeWidth={2} />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-gray-900">
                    {otherLabel}
                  </h2>
                  <p className="text-xs text-gray-400">Shared chat room</p>
                </div>
                <button
                  type="button"
                  aria-label="Close chat"
                  onClick={() => setOpen(false)}
                  className="hidden rounded-full p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600 sm:block"
                >
                  <X className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4">
                {loading ? (
                  <p className="text-center text-sm text-gray-400">
                    Loading messages...
                  </p>
                ) : messageGroups.length === 0 ? (
                  <p className="text-center text-sm text-gray-400">
                    Say hello to start the conversation.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messageGroups.map((group) => (
                      <section key={group.dateKey} className="flex flex-col gap-2">
                        <div className="flex justify-center">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gray-500 shadow-sm ring-1 ring-black/[0.04] sm:text-xs">
                            {formatDateLabel(group.dateKey)}
                          </span>
                        </div>
                        {group.items.map((message) => {
                          const isOwn = message.sender_id === currentUserId;

                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[82%] px-3 py-2 sm:max-w-[75%] ${
                                  isOwn
                                    ? "rounded-2xl rounded-br-md bg-blue-500 text-white shadow-sm"
                                    : "rounded-2xl rounded-bl-md bg-white text-gray-900 shadow-md ring-1 ring-black/[0.04]"
                                }`}
                              >
                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-[15px]">
                                  {message.body}
                                </p>
                                <p
                                  className={`mt-1 text-right text-[10px] sm:text-[11px] ${
                                    isOwn ? "text-blue-100" : "text-gray-400"
                                  }`}
                                >
                                  {formatMessageTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </section>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-gray-200/80 bg-white px-3 py-3 sm:px-4">
                <div className="flex items-end gap-2">
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Message"
                    rows={1}
                    maxLength={2000}
                    disabled={isSending}
                    enterKeyHint="send"
                    autoComplete="off"
                    className="max-h-28 min-h-11 flex-1 resize-none rounded-3xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none disabled:opacity-50 sm:text-sm"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Send message"
                    disabled={isSending || !body.trim()}
                    onClick={handleSend}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition hover:bg-blue-600 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                {error ? (
                  <p className="mt-2 text-xs text-red-500">{error}</p>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        aria-label="Open chat"
        onClick={() => setOpen(true)}
        className="relative z-10 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-gray-600 sm:p-2"
      >
        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
      </button>
      {modal}
    </>
  );
}
