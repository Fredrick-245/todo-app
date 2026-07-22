"use client";

import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { createComment } from "@/actions/comments";
import { chatGateway } from "@/lib/chat-gateway";
import { useTodoComments } from "@/hooks/use-todo-comments";
import { useTypingIndicator } from "@/hooks/use-typing-indicator";
import type { AppMember } from "@/lib/allowed-users";
import { getMemberLabel } from "@/lib/members";

type TodoCommentsProps = {
  todoId: string;
  enabled: boolean;
  members: AppMember[];
  currentUserId: string;
};

function formatCommentTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TodoComments({
  todoId,
  enabled,
  members,
  currentUserId,
}: TodoCommentsProps) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { comments, loading } = useTodoComments(todoId, enabled);

  const currentMember = members.find((member) => member.id === currentUserId);
  const currentUserName = currentMember
    ? getMemberLabel(currentMember.email)
    : "You";

  const { typingName, notifyTyping } = useTypingIndicator(
    todoId,
    enabled,
    currentUserId,
    currentUserName,
  );

  const getAuthorLabel = (authorId: string) => {
    const member = members.find((item) => item.id === authorId);
    return member ? getMemberLabel(member.email) : "Someone";
  };

  const handleChange = (value: string) => {
    setBody(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.trim()) {
      notifyTyping();
      typingTimeoutRef.current = setTimeout(() => {
        notifyTyping();
      }, 400);
    }
  };

  const submitComment = () => {
    const trimmed = body.trim();
    if (!trimmed || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await createComment(todoId, trimmed);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.comment) {
        chatGateway.publishComment(result.comment);
      }

      setBody("");
    });
  };

  return (
    <div
      className="mt-3 border-t border-black/[0.06] pt-3"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {loading ? (
        <p className="text-[11px] text-gray-400 sm:text-xs">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-[11px] text-gray-400 sm:text-xs">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-xl bg-white/70 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-gray-700 sm:text-xs">
                  {getAuthorLabel(comment.author_id)}
                </span>
                <span className="shrink-0 text-[10px] text-gray-400 sm:text-[11px]">
                  {formatCommentTime(comment.created_at)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={body}
          placeholder="Add a comment..."
          maxLength={1000}
          rows={1}
          disabled={isPending}
          enterKeyHint="enter"
          autoComplete="off"
          autoCorrect="on"
          className="min-h-9 max-h-24 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none disabled:opacity-50 sm:text-sm"
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            // Enter should never publish — only the send button does.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
            }
          }}
          onKeyUp={(event) => event.stopPropagation()}
        />
        <button
          type="button"
          aria-label="Send comment"
          disabled={isPending || !body.trim()}
          onClick={submitComment}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition hover:bg-blue-600 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      {typingName ? (
        <p className="mt-1.5 text-[11px] text-gray-400 sm:text-xs">
          {typingName} is typing...
        </p>
      ) : null}
      {error ? (
        <p className="mt-1.5 text-[11px] text-red-500 sm:text-xs">{error}</p>
      ) : null}
    </div>
  );
}
